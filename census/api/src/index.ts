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
            await completeCaptureRequest(capture.id, videoUrl);
            span.setStatus({ code: 1, message: 'ok' });
          } catch (error) {
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

  server.listen({ port: Number(process.env.PORT), host: process.env.HOST }, async (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening on ${address}`);

    leader.acquire(async ({ signal }) => {
      const backoff = new ExponentialBackoffStrategy({ name: 'capture-leader', timeoutMs: 4_000 });

      while (!signal.aborted) {
        await backoff.wait();

        const capture = await getNextCaptureRequest();
        if (!capture) {
          await backoff.timeout();
          continue;
        }

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
              await processingCaptureRequest(capture.id);
              const videoUrl = await requestClipFromCamManager(
                capture.startCaptureAt,
                capture.endCaptureAt,
                capture.id
              );
              completeCaptureRequestInBackground(capture, videoUrl);
              span.setStatus({ code: 1, message: 'completion_queued' });
              backoff.success();
            } catch (error) {
              span.setStatus({ code: 2, message: 'error' });
              await failCaptureRequest(capture.id);
              backoff.failure(error);
            }
          }
        );
      }
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
