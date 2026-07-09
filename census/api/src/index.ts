import { config } from 'dotenv';
config();

import { monitorEventLoopDelay } from 'node:perf_hooks';
import { createEnvironment, withEnvironment } from './utils/env/env.js';
const environment = await createEnvironment();

import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import * as Sentry from '@sentry/node';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import Queue from 'p-queue';
import { createRouter } from './api/index.js';
import { checkDatabaseHealth, tearDownDatabase } from './db/db.js';
import { defineListener } from './db/defineListener.js';
import { PostgresLeader } from './db/leader.js';
import type { Capture } from './db/schema/index.js';
import authRouter from './services/auth/router.js';
import { requestClipFromCamManager } from './services/cams/index.js';
import {
  completeCaptureRequest,
  failCaptureRequest,
  getNextCaptureRequest,
  processingCaptureRequest,
  requeueStuckProcessingCaptures
} from './services/capture/index.js';
import { createContext } from './trpc/context.js';
import { ExponentialBackoffStrategy } from './utils/backoff.js';
import { runLongOperation, tearDown, waitForLongOperations } from './utils/teardown.js';
// Export type router type signature,
// NOT the router itself.
export type AppRouter = ReturnType<typeof createRouter>;

const leader = new PostgresLeader(703, 1);
const CAPTURE_QUEUE_SAFETY_POLL_MS = 60_000;
const CAPTURE_QUEUE_MAX_BACKOFF_MS = 5 * 60_000;
const READINESS_SLOW_THRESHOLD_MS = 500;
const EVENT_LOOP_DELAY_WARN_THRESHOLD_MS = 250;
const CAPTURE_SSE_PROTOCOL_HEADER = 'x-census-sse-protocol';
const CAPTURE_SSE_PROTOCOL_VERSION = '1';
const UNCONVERTED_CAPTURES_SUBSCRIPTION_PATH = '/capture.live.unconvertedCaptures';
const readinessEventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
readinessEventLoopDelay.enable();
// Minimum spacing between consecutive clip requests when draining a backlog,
// so residual captures don't hammer the cam manager back-to-back.
const CAPTURE_QUEUE_DRAIN_PACE_MS = 10_000;

// Captures whose completion is currently running in the background in this
// process. Used so the stuck-capture sweep doesn't requeue them.
const activeCompletions = new Set<number>();

// Bounds how many mux completions run at once; a drained backlog would
// otherwise open one asset-polling loop per capture concurrently. Captures
// stay 'processing' while queued here, so the worker won't re-pick them, and
// anything still queued at shutdown is recovered by the stuck-capture sweep.
const completionQueue = new Queue({ concurrency: 3 });

type CaptureQueueWaitResult = 'wake' | 'timeout' | 'closed' | 'aborted';

const logCaptureQueueWorker = (message: string, details: Record<string, unknown> = {}) => {
  if (environment.variables.NODE_ENV !== 'development') return;

  console.log('[capture-leader]', message, details);
};

const runCaptureCompletion = async (capture: Capture, videoUrl: string) => {
  await withEnvironment(environment, async () => {
    await Sentry.startSpan(
      {
        name: 'capture-leader.complete',
        op: 'capture.complete',
        forceTransaction: true,
        attributes: {
          'capture.id': capture.id,
          'capture.status': capture.status,
          'capture.feed_id': capture.feedId,
          'capture.upgrade_attempt_count': capture.upgradeAttemptCount
        }
      },
      async span => {
        try {
          logCaptureQueueWorker('completing capture', { id: capture.id, videoUrl });
          await completeCaptureRequest(capture.id, videoUrl);
          logCaptureQueueWorker('capture completed', { id: capture.id });
          span.setStatus({ code: 1, message: 'ok' });
        } catch (error) {
          logCaptureQueueWorker('capture completion failed', { id: capture.id, error });
          span.setStatus({ code: 2, message: 'error' });
          Sentry.captureException(error, {
            tags: {
              component: 'capture-leader',
              phase: 'complete'
            },
            contexts: {
              capture: {
                id: capture.id,
                feed_id: capture.feedId,
                video_url: videoUrl,
                upgrade_attempt_count: capture.upgradeAttemptCount
              }
            }
          });

          try {
            await failCaptureRequest(capture.id);
          } catch (failError) {
            Sentry.captureException(failError, {
              tags: {
                component: 'capture-leader',
                phase: 'mark_failed'
              },
              contexts: {
                capture: {
                  id: capture.id,
                  feed_id: capture.feedId,
                  video_url: videoUrl,
                  upgrade_attempt_count: capture.upgradeAttemptCount
                }
              }
            });
            throw failError;
          }

          throw error;
        }
      }
    );
  });
};

const completeCaptureRequestInBackground = (capture: Capture, videoUrl: string) => {
  activeCompletions.add(capture.id);
  void completionQueue
    .add(() => runLongOperation(() => runCaptureCompletion(capture, videoUrl), `Complete capture ${capture.id}`))
    .catch(error => {
      console.error(`Failed to complete capture ${capture.id}`, error);
    })
    .finally(() => {
      activeCompletions.delete(capture.id);
    });
};

const processCaptureRequest = async (capture: Capture, backoff: ExponentialBackoffStrategy) => {
  await Sentry.startSpan(
    {
      name: 'capture-leader.process',
      op: 'capture.leader',
      forceTransaction: true,
      attributes: {
        'capture.id': capture.id,
        'capture.status': capture.status,
        'capture.feed_id': capture.feedId,
        'capture.upgrade_attempt_count': capture.upgradeAttemptCount
      }
    },
    async span => {
      try {
        logCaptureQueueWorker('processing capture', {
          id: capture.id,
          status: capture.status,
          feedId: capture.feedId,
          upgradeAttemptCount: capture.upgradeAttemptCount
        });

        // The capture may have left the queue (e.g. killed by the user)
        // between being picked up and the attempt starting.
        const claimed = await processingCaptureRequest(capture.id);
        if (!claimed) {
          logCaptureQueueWorker('capture no longer eligible, skipping', { id: capture.id });
          span.setStatus({ code: 1, message: 'skipped' });
          return;
        }

        const videoUrl = await requestClipFromCamManager(capture.startCaptureAt, capture.endCaptureAt, capture.id);
        logCaptureQueueWorker('clip request completed', { id: capture.id, videoUrl });
        completeCaptureRequestInBackground(capture, videoUrl);
        span.setStatus({ code: 1, message: 'completion_queued' });
        backoff.success();
      } catch (error) {
        logCaptureQueueWorker('capture processing failed', { id: capture.id, error });
        span.setStatus({ code: 2, message: 'error' });

        try {
          await failCaptureRequest(capture.id);
        } catch (failError) {
          Sentry.captureException(failError, {
            tags: { component: 'capture-leader', phase: 'mark_failed' },
            contexts: { capture: { id: capture.id, feed_id: capture.feedId } }
          });
        }

        backoff.failure(error);
      }
    }
  );
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const drainCaptureQueue = async (signal: AbortSignal, backoff: ExponentialBackoffStrategy) => {
  logCaptureQueueWorker('draining capture queue');

  let isFirstCapture = true;
  while (!signal.aborted) {
    await backoff.wait();
    // Space out consecutive clip requests when working through a backlog so
    // the cam manager isn't hit back-to-back. The first capture of a drain is
    // processed immediately so fresh submissions stay snappy.
    if (!isFirstCapture) await sleep(CAPTURE_QUEUE_DRAIN_PACE_MS);
    if (signal.aborted) {
      logCaptureQueueWorker('drain aborted');
      return;
    }

    const capture = await getNextCaptureRequest();
    if (!capture) {
      logCaptureQueueWorker('no eligible capture found');
      return;
    }

    logCaptureQueueWorker('eligible capture found', {
      id: capture.id,
      status: capture.status,
      retryUpgradeFrom: capture.retryUpgradeFrom
    });

    isFirstCapture = false;

    try {
      await processCaptureRequest(capture, backoff);
    } catch (error) {
      // Unexpected errors (e.g. the database going away mid-attempt) must not
      // crash the worker; stop draining and resume on the next wake/poll.
      console.error(`Unexpected error processing capture ${capture.id}`, error);
      Sentry.captureException(error, { tags: { component: 'capture-leader', phase: 'drain' } });
      return;
    }
  }
};

const isAbortError = (error: unknown) => {
  return error instanceof Error && error.name === 'AbortError';
};

const nextCaptureQueueWake = async (
  wakeups: AsyncIterator<number>,
  signal: AbortSignal
): Promise<CaptureQueueWaitResult> => {
  try {
    const result = await wakeups.next();
    if (result.done) return 'closed';
    return 'wake';
  } catch (error) {
    if (signal.aborted || isAbortError(error)) return 'aborted';
    throw error;
  }
};

const createSafetyPollTimeout = (signal: AbortSignal) => {
  let timer: NodeJS.Timeout | undefined;
  let abort: (() => void) | undefined;

  const cleanup = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;

    if (abort) signal.removeEventListener('abort', abort);
    abort = undefined;
  };

  const promise = new Promise<CaptureQueueWaitResult>(resolve => {
    if (signal.aborted) {
      resolve('aborted');
      return;
    }

    abort = () => {
      cleanup();
      resolve('aborted');
    };

    timer = setTimeout(() => {
      cleanup();
      resolve('timeout');
    }, CAPTURE_QUEUE_SAFETY_POLL_MS);

    signal.addEventListener('abort', abort, { once: true });
  });

  return {
    promise,
    cancel: cleanup
  };
};

const waitForCaptureQueueWakeOrSafetyPoll = async (nextWake: Promise<CaptureQueueWaitResult>, signal: AbortSignal) => {
  const timeout = createSafetyPollTimeout(signal);

  try {
    return await Promise.race([nextWake, timeout.promise]);
  } finally {
    timeout.cancel();
  }
};

const runCaptureQueueWorker = async (signal: AbortSignal) => {
  logCaptureQueueWorker('worker starting', { safetyPollMs: CAPTURE_QUEUE_SAFETY_POLL_MS });

  // The worker runs forever, so the backoff must never exhaust (which throws
  // and would crash the worker into a leader re-acquire loop). Instead the
  // delay between attempts is capped.
  const backoff = new ExponentialBackoffStrategy({
    name: 'capture-leader',
    timeoutMs: CAPTURE_QUEUE_SAFETY_POLL_MS,
    maxAttempts: Number.POSITIVE_INFINITY,
    maxDelayMs: CAPTURE_QUEUE_MAX_BACKOFF_MS
  });

  // Requeue captures stranded in 'processing' by a previous crash or deploy,
  // excluding any completions currently running in this process.
  try {
    const requeued = await requeueStuckProcessingCaptures([...activeCompletions]);
    if (requeued.length > 0) {
      logCaptureQueueWorker('requeued stuck processing captures', { ids: requeued.map(({ id }) => id) });
    }
  } catch (error) {
    console.error('Failed to requeue stuck processing captures', error);
    Sentry.captureException(error, { tags: { component: 'capture-leader', phase: 'requeue_stuck' } });
  }
  const captureQueueWake = defineListener({
    changes: { table: 'captures', events: ['insert', 'update'] },
    handler: () => Date.now()
  });
  const wakeups = captureQueueWake.subscribe({ signal })[Symbol.asyncIterator]();
  let nextWake = nextCaptureQueueWake(wakeups, signal);

  try {
    while (!signal.aborted) {
      const result = await waitForCaptureQueueWakeOrSafetyPoll(nextWake, signal);
      logCaptureQueueWorker('worker wake result', { result });

      if (result === 'aborted' || result === 'closed') return;

      await drainCaptureQueue(signal, backoff);

      if (result === 'wake') {
        nextWake = nextCaptureQueueWake(wakeups, signal);
      }
    }
  } finally {
    logCaptureQueueWorker('worker stopping');
    await wakeups.return?.();
    captureQueueWake.close();
  }
};

await withEnvironment(environment, async () => {
  const router = createRouter();
  const options = { maxParamLength: 5000 };
  const server = fastify(options);

  await server.register(cors, {
    allowedHeaders: ['authorization', 'content-type', 'sentry-trace', 'baggage', CAPTURE_SSE_PROTOCOL_HEADER],
    exposedHeaders: ['X-Census-Points', 'X-Census-Achievements']
  });

  server.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?', 1)[0];

    if (
      request.method === 'GET' &&
      path === UNCONVERTED_CAPTURES_SUBSCRIPTION_PATH &&
      request.headers[CAPTURE_SSE_PROTOCOL_HEADER] !== CAPTURE_SSE_PROTOCOL_VERSION
    ) {
      return reply.code(204).send();
    }
  });

  server.get('/healthz', async () => ({ status: 'ok' }));
  server.get('/readyz', async (_, reply) => {
    const startedAt = performance.now();

    try {
      await withEnvironment(environment, checkDatabaseHealth);

      const databaseRoundTripMs = Math.round(performance.now() - startedAt);
      const eventLoopDelayMaxMs = Math.round(readinessEventLoopDelay.max / 1e6);
      readinessEventLoopDelay.reset();

      if (
        databaseRoundTripMs >= READINESS_SLOW_THRESHOLD_MS ||
        eventLoopDelayMaxMs >= EVENT_LOOP_DELAY_WARN_THRESHOLD_MS
      ) {
        console.warn(
          `Readiness check slow: databaseRoundTripMs=${databaseRoundTripMs} eventLoopDelayMaxMs=${eventLoopDelayMaxMs}`
        );
      }

      return { status: 'ok' };
    } catch (error) {
      const databaseRoundTripMs = Math.round(performance.now() - startedAt);
      const eventLoopDelayMaxMs = Math.round(readinessEventLoopDelay.max / 1e6);
      readinessEventLoopDelay.reset();
      console.error(
        `Readiness check failed: databaseRoundTripMs=${databaseRoundTripMs} eventLoopDelayMaxMs=${eventLoopDelayMaxMs}`,
        error
      );
      return reply.status(503).send({ status: 'unavailable' });
    }
  });

  await server.register(websocket);
  await server.register(authRouter, { prefix: '/auth' });
  await server.register(fastifyTRPCPlugin, {
    trpcOptions: {
      router,
      createContext,
      onError() {}
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions']
  });

  server.listen({ port: Number(process.env.PORT), host: process.env.HOST }, async (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening on ${address}`);

    leader.acquire(async ({ signal }) => {
      await runCaptureQueueWorker(signal);
    });

    const tearDownHandler = await tearDown([
      {
        name: 'leader',
        fn: () => leader.stop()
      },
      {
        name: 'fastify',
        fn: () => server.close()
      },
      {
        name: 'long operations',
        fn: waitForLongOperations
      },
      {
        name: 'database',
        fn: tearDownDatabase
      }
    ]);

    process.on('SIGTERM', () => withEnvironment(environment, tearDownHandler));
    process.on('SIGINT', () => withEnvironment(environment, tearDownHandler));
  });
});
