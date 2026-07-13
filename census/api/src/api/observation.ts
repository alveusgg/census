import { z } from 'zod';
import { getPermissions } from '../services/auth/role.js';
import {
  confirmObservationWithoutAccessoryIdentification,
  createObservationsFromCapture,
  deleteObservation,
  getObservationCount,
  getObservations,
  getUnconfirmedObservationCount,
  locateObservation,
  mergeObservations,
  observationDeletionReasons,
  ObservationPayload
} from '../services/observations/observations.js';
import { cache, jsonResponse, procedure, procedureWithPermissions, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export const Pagination = z.object({
  page: z.number().default(1),
  size: z.number().default(30)
});

export type Pagination = z.infer<typeof Pagination>;

const LocationBox = z.object({
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number()
});

export const Query = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  confirmed: z.boolean().default(false),

  within: z.union([LocationBox, z.array(LocationBox).min(1)]).optional()
});

export type Query = z.infer<typeof Query>;

export const createObservationRouter = () =>
  router({
    createObservationsFromCapture: procedureWithPermissions('capture')
      .input(z.object({ captureId: z.number(), observations: z.array(ObservationPayload).min(1) }))
      .use(
        cache.mutation({
          keys: [['observations'], ['captures'], ['users', 'identifications']]
        })
      )
      .mutation(async ({ input, ctx }) => {
        // This marks the response as something that has changed points or achievements
        // The client will then invalidate the points and achievements cache
        ctx.points();
        ctx.achievements();
        return await createObservationsFromCapture(input.captureId, input.observations);
      }),

   
    delete: procedureWithPermissions('moderate')
      .input(z.object({ observationId: z.number(), reason: z.enum(observationDeletionReasons) }))
      .use(
        cache.mutation({
          keys: [
            ['observations'],
            ['observations', 'unconfirmedCount'],
            ['identifications'],
            ['users', 'identifications'],
            ['users', 'profile'],
            ['users', 'leaderboard'],
            ['users', 'leaderboardPage'],
            ['captures']
          ]
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await deleteObservation(input.observationId, input.reason);
        if (result.pointsChanged) {
          ctx.points();
          ctx.achievements();
        }
        return result;
      }),

    locate: procedureWithPermissions('capture')
      .input(z.object({ id: z.number(), location: z.object({ x: z.number(), y: z.number() }) }))
      .use(
        cache.mutation({
          keys: [['observations'], ['identifications']]
        })
      )
      .mutation(async ({ input }) => {
        return await locateObservation(input.id, input.location);
      }),

    confirmWithoutAccessoryIdentification: procedureWithPermissions('moderate')
      .input(z.object({ observationId: z.number() }))
      .use(
        cache.mutation({
          keys: [['observations'], ['observations', 'unconfirmedCount'], ['identifications']]
        })
      )
      .mutation(async ({ input }) => {
        return await confirmObservationWithoutAccessoryIdentification(input.observationId);
      }),

    merge: procedureWithPermissions('moderate')
      .input(z.object({ targetObservationId: z.number(), sourceObservationIds: z.array(z.number()).min(1) }))
      .use(
        cache.mutation({
          keys: [
            ['observations'],
            ['observations', 'unconfirmedCount'],
            ['identifications'],
            ['users', 'identifications'],
            ['users', 'profile'],
            ['users', 'leaderboard'],
            ['users', 'leaderboardPage'],
            ['captures']
          ]
        })
      )
      .mutation(async ({ ctx, input }) => {
        ctx.points();
        ctx.achievements();
        return await mergeObservations(input.targetObservationId, input.sourceObservationIds);
      }),

    list: procedure.input(z.object({ meta: Pagination, query: Query.optional() })).query(async ({ ctx, input }) => {
      const user = useUser();
      const permissions = getPermissions();

      const databaseStartedAt = performance.now();
      const count = await getObservationCount(input.query);
      const data = await getObservations(input.meta, input.query);
      ctx.timing('db', performance.now() - databaseStartedAt);

      // Fog of war: hide feedback on each observation until the user has
      // given feedback on that observation, avoiding page-wide unlocks.
      const fogOfWarStartedAt = performance.now();
      if (!permissions.moderate) {
        for (const observation of data) {
          const hasGivenFeedback = observation.identifications.some(identification =>
            identification.feedback.some(feedback => feedback.userId === user.id)
          );

          if (hasGivenFeedback) continue;

          for (const identification of observation.identifications) {
            identification.feedback.length = 0;
          }
        }
      }
      ctx.timing('fogofwar', performance.now() - fogOfWarStartedAt);

      return jsonResponse({
        meta: {
          ...input.meta,
          total: count
        },
        data
      });
    }),

    unconfirmedCount: procedure
      .use(cache.query({ key: ['observations', 'unconfirmedCount'], ttl: 30 }))
      .query(async () => {
        return await getUnconfirmedObservationCount();
      })
  });
