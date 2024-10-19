import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import { useEnvironment } from '../utils/env/env.js';

export function createContext({ req, res, info }: CreateFastifyContextOptions) {
  const env = useEnvironment();
  const headers = req.headers;
  const authorization = headers.authorization ?? info.connectionParams?.Authorization;

  return {
    ...env,
    authorization,
    req,
    res
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
