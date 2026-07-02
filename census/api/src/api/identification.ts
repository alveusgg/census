import { z } from 'zod';
import {
  addFeedbackToIdentification,
  addJustificationToIdentification,
  confirmIdentification,
  getIdentification,
  getIdentificationsGroupedBySource,
  removeFeedbackComment,
  removeIdentification,
  suggestAccessoryIdentification,
  suggestIdentification
} from '../services/identifications/identifications.js';
import { getTaxaFromPartialSearch } from '../services/inat/index.js';
import { getImagesForObservationId } from '../services/observations/observations.js';
import { cache, procedure, procedureWithPermissions, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

const confirmationAnnotationSchema = z.object({
  box: z.object({
    height: z.number(),
    width: z.number(),
    x: z.number(),
    y: z.number()
  }),
  canvas: z
    .object({
      height: z.number(),
      width: z.number()
    })
    .optional(),
  comment: z.string().optional(),
  imageId: z.string(),
  imageIndex: z.number().int().nonnegative(),
  shape: z.string()
});

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
        const result = await addFeedbackToIdentification(input.id, user.id, input.type, input.comment);
        if (result.pointsAwarded > 0) {
          ctx.points();
        }
        return result;
      }),
    justification: procedureWithPermissions('suggest')
      .input(
        z.object({
          id: z.number(),
          comment: z.string().trim().min(1)
        })
      )
      .use(
        cache.mutation({
          keys: [['observations'], ['identifications']]
        })
      )
      .mutation(async ({ input }) => {
        const user = useUser();
        return await addJustificationToIdentification(input.id, user.id, input.comment);
      }),
    removeFeedbackComment: procedureWithPermissions('moderate')
      .input(z.object({ id: z.number() }))
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
        await removeFeedbackComment(input.id);
        ctx.points();
        ctx.achievements();
      }),
    searchForTaxa: procedure
      .input(z.object({ query: z.string(), taxonId: z.number().optional() }))
      .use(
        cache.query({
          key: ({ input }) => [
            'inat',
            'taxaSearch',
            input.query.trim().toLowerCase(),
            input.taxonId?.toString() ?? 'all'
          ],
          ttl: 60 * 60
        })
      )
      .query(async ({ input }) => {
        return await getTaxaFromPartialSearch(input.query, input.taxonId);
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

    remove: procedure
      .input(z.object({ id: z.number() }))
      .use(
        cache.mutation({
          keys: [
            ['observations'],
            ['identifications'],
            ['users', 'identifications'],
            ['users', 'profile'],
            ['users', 'leaderboard'],
            ['users', 'leaderboardPage'],
            ['observations', 'unconfirmedCount']
          ]
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await removeIdentification(input.id);
        ctx.points();
        ctx.achievements();
        return result;
      }),

    confirm: procedureWithPermissions('confirm')
      .input(
        z.object({
          id: z.number(),
          comment: z.string(),
          annotations: z.array(confirmationAnnotationSchema).default([])
        })
      )
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
        return await confirmIdentification(input.id, input.comment, input.annotations);
      })
  });
