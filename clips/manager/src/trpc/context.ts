import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { useEnvironment } from '../utils/env/env.js';

export function createContext({ req, res, info }: CreateFastifyContextOptions) {
  const env = useEnvironment();

  return {
    ...env,
    req,
    res
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
