import { config } from 'dotenv';

config();

import { monitorEventLoopDelay } from 'node:perf_hooks';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { createRouter } from './api/index.js';
import { checkDatabaseHealth, tearDownDatabase } from './db/db.js';
import authRouter from './services/auth/router.js';
import { createCaptureQueueWorker } from './services/capture/worker.js';
import { createContext } from './trpc/context.js';
import { createEnvironment, withEnvironment } from './utils/env/env.js';
import { tearDown, waitForLongOperations } from './utils/teardown.js';

// Export the router's type signature, not the router itself.
export type AppRouter = ReturnType<typeof createRouter>;

const READINESS_SLOW_THRESHOLD_MS = 500;
const EVENT_LOOP_DELAY_WARN_THRESHOLD_MS = 250;
const CAPTURE_SSE_PROTOCOL_HEADER = 'x-census-sse-protocol';
const CAPTURE_SSE_PROTOCOL_VERSION = '1';
const UNCONVERTED_CAPTURES_SUBSCRIPTION_PATH = '/capture.live.unconvertedCaptures';

const environment = await createEnvironment();
const readinessEventLoopDelay = monitorEventLoopDelay({ resolution: 20 });
readinessEventLoopDelay.enable();

const getReadinessMetrics = (startedAt: number) => {
  const metrics = {
    databaseRoundTripMs: Math.round(performance.now() - startedAt),
    eventLoopDelayMaxMs: Math.round(readinessEventLoopDelay.max / 1e6)
  };
  readinessEventLoopDelay.reset();
  return metrics;
};

await withEnvironment(environment, async () => {
  const server = fastify({ maxParamLength: 5000 });
  const captureQueueWorker = createCaptureQueueWorker();

  await server.register(cors, {
    allowedHeaders: ['authorization', 'content-type', 'sentry-trace', 'baggage', CAPTURE_SSE_PROTOCOL_HEADER],
    exposedHeaders: ['X-Census-Points', 'X-Census-Achievements', 'Server-Timing']
  });

  server.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?', 1)[0];
    const hasSupportedCaptureProtocol = request.headers[CAPTURE_SSE_PROTOCOL_HEADER] === CAPTURE_SSE_PROTOCOL_VERSION;

    if (request.method === 'GET' && path === UNCONVERTED_CAPTURES_SUBSCRIPTION_PATH && !hasSupportedCaptureProtocol) {
      return reply.code(204).send();
    }
  });

  server.get('/healthz', async () => ({ status: 'ok' }));
  server.get('/readyz', async (_request, reply) => {
    const startedAt = performance.now();

    try {
      await withEnvironment(environment, checkDatabaseHealth);

      const metrics = getReadinessMetrics(startedAt);
      if (
        metrics.databaseRoundTripMs >= READINESS_SLOW_THRESHOLD_MS ||
        metrics.eventLoopDelayMaxMs >= EVENT_LOOP_DELAY_WARN_THRESHOLD_MS
      ) {
        console.warn(
          `Readiness check slow: databaseRoundTripMs=${metrics.databaseRoundTripMs} eventLoopDelayMaxMs=${metrics.eventLoopDelayMaxMs}`
        );
      }

      return { status: 'ok' };
    } catch (error) {
      const metrics = getReadinessMetrics(startedAt);
      console.error(
        `Readiness check failed: databaseRoundTripMs=${metrics.databaseRoundTripMs} eventLoopDelayMaxMs=${metrics.eventLoopDelayMaxMs}`,
        error
      );
      return reply.status(503).send({ status: 'unavailable' });
    }
  });

  await server.register(websocket);
  await server.register(authRouter, { prefix: '/auth' });
  await server.register(fastifyTRPCPlugin, {
    trpcOptions: {
      router: createRouter(),
      createContext,
      onError() {}
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions']
  });

  let address: string;
  try {
    address = await server.listen({ port: Number(process.env.PORT), host: process.env.HOST });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Server listening on ${address}`);
  captureQueueWorker.start();

  const tearDownHandler = await tearDown([
    { name: 'capture queue worker', fn: captureQueueWorker.stop },
    { name: 'fastify', fn: () => server.close() },
    { name: 'long operations', fn: waitForLongOperations },
    { name: 'database', fn: tearDownDatabase }
  ]);

  process.on('SIGTERM', () => withEnvironment(environment, tearDownHandler));
  process.on('SIGINT', () => withEnvironment(environment, tearDownHandler));
});
