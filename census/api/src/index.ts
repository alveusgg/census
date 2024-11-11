import { config } from 'dotenv';
config();

import cors from '@fastify/cors';
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import router from './api/index.js';
import authRouter from './services/auth/router.js';
import { createContext } from './trpc/context.js';
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof router;

import { getEncodedTimestamp } from './services/twitch/index.js';
import { createEnvironment, withEnvironment } from './utils/env/env.js';

(async () => {
  try {
    const environment = await createEnvironment();
    await withEnvironment(environment, async () => {
      const options = { maxParamLength: 5000 };
      const server = fastify(options);
      await server.register(cors, {
        allowedHeaders: ['authorization', 'content-type'],
        exposedHeaders: ['X-Census-Points', 'X-Census-Achievements']
      });
      await server.register(authRouter);
      await server.register(fastifyTRPCPlugin, {
        trpcOptions: {
          router,
          createContext,
          onError() {}
        } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions']
      });
      server.listen({ port: Number(process.env.PORT), host: process.env.HOST }, async (err, address) => {
        const pixels = await getEncodedTimestamp(
          'https://static-cdn.jtvnw.net/twitch-clips-thumbnails-prod/OilyClumsyLorisLitFam-UhVlgBoVRPDlk1X1/0339a75a-4829-4242-8e36-dcd08f2f4793/preview.jpg'
        );
        console.log(pixels);
        if (err) {
          console.error(err);
          process.exit(1);
        }
        console.log(`Server listening on ${address}`);
      });
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
