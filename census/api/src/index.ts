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
import authRouter from './services/auth/router.js';
import { createContext } from './trpc/context.js';
import { tearDown, waitForLongOperations } from './utils/teardown.js';
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;

await withEnvironment(environment, async () => {
  const options = { maxParamLength: 5000 };
  const server = fastify(options);
  await server.register(cors, {
    allowedHeaders: ['authorization', 'content-type', 'traceparent', 'tracestate'],
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

    const tearDownHandler = await tearDown([
      {
        name: 'fastify',
        fn: () => server.close()
      },
      {
        name: 'database',
        fn: tearDownDatabase
      },
      {
        name: 'long operations',
        fn: waitForLongOperations
      }
    ]);

    process.on('SIGTERM', () => withEnvironment(environment, tearDownHandler));
    process.on('SIGINT', () => withEnvironment(environment, tearDownHandler));
  });
});
