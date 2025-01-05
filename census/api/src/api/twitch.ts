import { z } from 'zod';
import { getClip, getVOD } from '../services/twitch/index.js';
import { procedure, router } from '../trpc/trpc.js';
export default router({
  clip: procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return getClip(input.id);
  }),
  vod: procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return getVOD(input.id);
  })
});
