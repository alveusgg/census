import { config } from 'dotenv';
config();

import { createEnvironment, withEnvironment } from './utils/env/env.js';
const environment = await createEnvironment();

import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import * as Sentry from '@sentry/node';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { createRouter } from './api/index.js';
import { tearDownDatabase } from './db/db.js';
import { defineListener } from './db/defineListener.js';
import { PostgresLeader } from './db/leader.js';
import type { Capture } from './db/schema/index.js';
import authRouter from './services/auth/router.js';
import { requestClipFromCamManager } from './services/cams/index.js';
import {
  completeCaptureRequest,
  failCaptureRequest,
  getNextCaptureRequest,
  processingCaptureRequest
} from './services/capture/index.js';
import { createContext } from './trpc/context.js';
import { ExponentialBackoffStrategy } from './utils/backoff.js';
import { runLongOperation, tearDown, waitForLongOperations } from './utils/teardown.js';
// Export type router type signature,
// NOT the router itself.
export type AppRouter = ReturnType<typeof createRouter>;

const leader = new PostgresLeader(703, 1);
const CAPTURE_QUEUE_SAFETY_POLL_MS = 60_000;

type CaptureQueueWaitResult = 'wake' | 'timeout' | 'closed' | 'aborted';

const logCaptureQueueWorker = (message: string, details: Record<string, unknown> = {}) => {
  if (environment.variables.NODE_ENV !== 'development') return;

  console.log('[capture-leader]', message, details);
};

const completeCaptureRequestInBackground = (capture: Capture, videoUrl: string) => {
  void runLongOperation(async () => {
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
  }, `Complete capture ${capture.id}`).catch(error => {
    console.error(`Failed to complete capture ${capture.id}`, error);
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
        await processingCaptureRequest(capture.id);
        const videoUrl = await requestClipFromCamManager(capture.startCaptureAt, capture.endCaptureAt, capture.id);
        logCaptureQueueWorker('clip request completed', { id: capture.id, videoUrl });
        completeCaptureRequestInBackground(capture, videoUrl);
        span.setStatus({ code: 1, message: 'completion_queued' });
        backoff.success();
      } catch (error) {
        logCaptureQueueWorker('capture processing failed', { id: capture.id, error });
        span.setStatus({ code: 2, message: 'error' });
        await failCaptureRequest(capture.id);
        backoff.failure(error);
      }
    }
  );
};

const drainCaptureQueue = async (signal: AbortSignal, backoff: ExponentialBackoffStrategy) => {
  logCaptureQueueWorker('draining capture queue');

  while (!signal.aborted) {
    await backoff.wait();
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

    await processCaptureRequest(capture, backoff);
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

  const backoff = new ExponentialBackoffStrategy({
    name: 'capture-leader',
    timeoutMs: CAPTURE_QUEUE_SAFETY_POLL_MS
  });
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
    allowedHeaders: ['authorization', 'content-type', 'sentry-trace', 'baggage'],
    exposedHeaders: ['X-Census-Points', 'X-Census-Achievements']
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

  const address = await server.listen({ port: Number(process.env.PORT), host: process.env.HOST });
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
