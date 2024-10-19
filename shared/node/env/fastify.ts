import { FastifyInstance, HookHandlerDoneFunction } from 'fastify';
import fp from 'fastify-plugin';

interface AssignEnvironmentOptions<T> {
  header: string;
  default?: string;
  getEnvironment: (prefix: string) => Promise<T>;
  assignToContext: (env: T, fn: HookHandlerDoneFunction) => void;
}

export const InitialiseTenantEnvironment = fp(
  async <T>(fastify: FastifyInstance, options: AssignEnvironmentOptions<T>) => {
    fastify.addHook('onRequest', (req, _, done) => {
      const prefix = req.headers[options.header] ?? options.default;
      if (!prefix) throw new Error('Missing tenant prefix');
      if (typeof prefix !== 'string') throw new Error('Invalid tenant prefix');

      options
        .getEnvironment(prefix)
        .then(env => options.assignToContext(env, done))
        .catch(done);
    });
  }
);
