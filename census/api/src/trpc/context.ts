import { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';

export function createContext({ req, res, info }: CreateFastifyContextOptions) {
  const headers = req.headers;
  const authorization = headers.authorization ?? info.connectionParams?.authorization;
  const timings = new Map<string, number>();

  const points = () => {
    res.header('x-census-points', new Date().toISOString());
  };
  const achievements = () => {
    res.header('x-census-achievements', new Date().toISOString());
  };
  const timing = (name: string, duration: number) => {
    if (!Number.isFinite(duration) || duration < 0) return;

    const metric = encodeURIComponent(name).replace(/[()]/g, character =>
      `%${character.charCodeAt(0).toString(16)}`.toUpperCase()
    );
    if (!metric) return;

    timings.set(metric, Math.round(duration * 100) / 100);
    res.header(
      'server-timing',
      Array.from(timings, ([metric, milliseconds]) => `${metric};dur=${milliseconds}`).join(', ')
    );
  };

  return {
    authorization,
    req,
    res,
    points,
    achievements,
    timing
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
