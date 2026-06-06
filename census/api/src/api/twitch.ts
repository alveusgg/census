import { z } from 'zod';
import { getClip, getVOD } from '../services/twitch/index.js';
import { cache, procedure, router } from '../trpc/trpc.js';
export default router({
  clip: procedure
    .input(z.object({ id: z.string() }))
    .use(cache.query({ key: ({ input }) => ['twitch', 'clip', input.id], ttl: 300 }))
    .query(async ({ input }) => {
      return getClip(input.id, 0);
    }),
  vod: procedure
    .input(z.object({ id: z.string() }))
    .use(cache.query({ key: ({ input }) => ['twitch', 'vod', input.id], ttl: 60 * 60 }))
    .query(async ({ input }) => {
      return getVOD(input.id);
    })
});
