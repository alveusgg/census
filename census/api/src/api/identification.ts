import { z } from 'zod';
import { suggestIdentification } from '../services/identifications/identifications.js';
import { getTaxaFromPartialSearch } from '../services/inat/index.js';
import { recordAchievement } from '../services/points/achievement.js';
import { procedure, router } from '../trpc/trpc';
import { useUser } from '../utils/env/env.js';

export default router({
  vote: procedure
    .input(
      z.object({
        id: z.number(),
        vote: z.enum(['up', 'down']),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = useUser();
      const points = await recordAchievement('vote', user.id);
      if (points) ctx.points(points);
    }),
  searchForTaxa: procedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    return await getTaxaFromPartialSearch(input.query);
  }),

  suggest: procedure.input(z.object({ observationId: z.number(), iNatId: z.number() })).mutation(async ({ input }) => {
    return await suggestIdentification(input.observationId, input.iNatId);
  })
});
