import { z } from 'zod';
import {
  addFeedbackToIdentification,
  confirmIdentification,
  getIdentification,
  getIdentificationsGroupedBySource,
  suggestAccessoryIdentification,
  suggestIdentification
} from '../services/identifications/identifications.js';
import { getTaxaFromPartialSearch } from '../services/inat/index.js';
import { getImagesForObservationId } from '../services/observations/observations.js';
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
      await recordAchievement('vote', user.id, { identificationId: input.id }, true);
      if (input.comment) {
        await recordAchievement('comment', user.id, { identificationId: input.id }, true);
      }
      ctx.points();
    }),
  searchForTaxa: procedure.input(z.object({ query: z.string() })).query(async ({ input }) => {
    return await getTaxaFromPartialSearch(input.query);
  }),

  identificationsGroupedBySource: procedure.query(async () => {
    return await getIdentificationsGroupedBySource();
  }),
  images: procedure.input(z.object({ observationId: z.number() })).query(async ({ input }) => {
    return await getImagesForObservationId(input.observationId);
  }),

  get: procedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await getIdentification(input.id);
  }),

  suggest: procedureWithPermissions('suggest')
    .input(z.object({ observationId: z.number(), iNatId: z.number() }))
    .mutation(async ({ input }) => {
      return await suggestIdentification(input.observationId, input.iNatId);
    }),
  suggestAccessory: procedureWithPermissions('suggest')
    .input(z.object({ observationId: z.number(), iNatId: z.number() }))
    .mutation(async ({ input }) => {
      return await suggestAccessoryIdentification(input.observationId, input.iNatId);
    }),

  confirm: procedureWithPermissions('confirm')
    .input(z.object({ id: z.number(), comment: z.string() }))
    .mutation(async ({ input }) => {
      return await confirmIdentification(input.id, input.comment);
    })
});
