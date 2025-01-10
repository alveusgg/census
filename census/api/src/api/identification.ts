import { z } from 'zod';
import { addFeedbackToIdentification, suggestIdentification } from '../services/identifications/identifications.js';
import { getTaxaFromPartialSearch } from '../services/inat/index.js';
import { recordAchievement } from '../services/points/achievement.js';
import { procedure, procedureWithPermissions, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export default router({
  feedback: procedureWithPermissions('vote')
    .input(
      z.object({
        id: z.number(),
        type: z.enum(['agree', 'disagree']),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = useUser();
      await addFeedbackToIdentification(input.id, user.id, input.type, input.comment);
      const points = await recordAchievement('vote', user.id, { identificationId: input.id }, true);
      if (points) ctx.points(points);
    }),
  searchForTaxa: procedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    return await getTaxaFromPartialSearch(input.query);
  }),

  suggest: procedureWithPermissions('suggest')
    .input(z.object({ observationId: z.number(), iNatId: z.number() }))
    .mutation(async ({ input }) => {
      return await suggestIdentification(input.observationId, input.iNatId);
    })
});
