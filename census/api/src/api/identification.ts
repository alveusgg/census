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
import { cache, procedure, procedureWithPermissions, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export const createIdentificationRouter = () =>
  router({
    feedback: procedureWithPermissions('vote')
      .input(
        z.object({
          id: z.number(),
          type: z.enum(['agree', 'disagree']),
          comment: z.string().optional()
        })
      )
      .use(
        cache.mutation({
          keys: [
            ['observations'],
            ['identifications'],
            ['users', 'identifications'],
            ['users', 'profile'],
            ['users', 'leaderboard'],
            ['users', 'leaderboardPage']
          ]
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = useUser();
        await addFeedbackToIdentification(input.id, user.id, input.type, input.comment);
        await recordAchievement('vote', user.id, { payload: { identificationId: input.id } }, true);
        if (input.comment) {
          await recordAchievement('comment', user.id, { payload: { identificationId: input.id } }, true);
        }
        ctx.points();
      }),
    searchForTaxa: procedure
      .input(z.object({ query: z.string() }))
      .use(
        cache.query({
          key: ({ input }) => ['inat', 'taxaSearch', input.query.trim().toLowerCase()],
          ttl: 60 * 60
        })
      )
      .query(async ({ input }) => {
        return await getTaxaFromPartialSearch(input.query);
      }),

    identificationsGroupedBySource: procedure
      .use(cache.query({ key: ['identifications', 'groupedBySource'], ttl: 300 }))
      .query(async () => {
        return await getIdentificationsGroupedBySource();
      }),
    images: procedure
      .input(z.object({ observationId: z.number() }))
      .use(cache.query({ key: ({ input }) => ['observations', 'images', input.observationId], ttl: 300 }))
      .query(async ({ input }) => {
        return await getImagesForObservationId(input.observationId);
      }),

    get: procedure
      .input(z.object({ id: z.number() }))
      .use(cache.query({ key: ({ input }) => ['identifications', 'detail', input.id], ttl: 60 }))
      .query(async ({ input }) => {
        return await getIdentification(input.id);
      }),

    suggest: procedureWithPermissions('suggest')
      .input(z.object({ observationId: z.number(), iNatId: z.number() }))
      .use(
        cache.mutation({
          keys: [['observations'], ['identifications'], ['users', 'identifications']]
        })
      )
      .mutation(async ({ input }) => {
        return await suggestIdentification(input.observationId, input.iNatId);
      }),
    suggestAccessory: procedureWithPermissions('suggest')
      .input(z.object({ observationId: z.number(), iNatId: z.number() }))
      .use(
        cache.mutation({
          keys: [['observations'], ['identifications'], ['users', 'identifications']]
        })
      )
      .mutation(async ({ input }) => {
        return await suggestAccessoryIdentification(input.observationId, input.iNatId);
      }),

    confirm: procedureWithPermissions('confirm')
      .input(z.object({ id: z.number(), comment: z.string() }))
      .use(
        cache.mutation({
          keys: [
            ['observations'],
            ['identifications'],
            ['users', 'identifications'],
            ['observations', 'unconfirmedCount']
          ]
        })
      )
      .mutation(async ({ input }) => {
        return await confirmIdentification(input.id, input.comment);
      })
  });
