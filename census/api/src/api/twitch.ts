import { z } from 'zod';
import { getClip, getVOD } from '../services/twitch';
import { procedure, router } from '../trpc/trpc';
export default router({
  clip: procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return getClip(input.id);
  }),
  vod: procedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    return getVOD(input.id);
  })
});
