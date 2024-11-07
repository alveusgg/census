import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export function createContext({ req, res, info }: CreateFastifyContextOptions) {
  const headers = req.headers;
  const authorization = headers.authorization ?? info.connectionParams?.authorization;

  const points = (number: number) => {
    res.header('x-census-points', number.toString());
  };
  const achievements = () => {
    res.header('x-census-achievements', new Date().toISOString());
  };
  return {
    authorization,
    req,
    res,
    points,
    achievements
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
