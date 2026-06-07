import { config } from 'dotenv';
config();

import { createEnvironment, withEnvironment } from './utils/env/env.js';
const environment = await createEnvironment();

import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import router from './api/index.js';
import { tearDownDatabase } from './db/db.js';
import { PostgresLeader } from './db/leader.js';
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
import { tearDown, waitForLongOperations } from './utils/teardown.js';
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;

const leader = new PostgresLeader(703, 1);

await withEnvironment(environment, async () => {
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

        await processingCaptureRequest(capture.id);

        try {
          const videoUrl = await requestClipFromCamManager(capture.startCaptureAt, capture.endCaptureAt);
          await completeCaptureRequest(capture.id, videoUrl);
          backoff.success();
        } catch (error) {
          await failCaptureRequest(capture.id);
          backoff.failure(error);
        }
      }
    });

    const tearDownHandler = await tearDown([
      {
        name: 'leader',
        fn: () => leader.stop()
      },
      {
        name: 'long operations',
        fn: waitForLongOperations
      },
      {
        name: 'fastify',
        fn: () => server.close()
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
