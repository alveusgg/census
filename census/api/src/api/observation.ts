import { z } from 'zod';
import { notifyDiscordAboutObservation } from '../services/discord/index.js';
import {
  createObservationsFromCapture,
  deleteObservation,
  getObservationCount,
  getObservations,
  getUnconfirmedObservationCount,
  locateObservation,
  mergeObservations,
  ObservationPayload
} from '../services/observations/observations.js';
import { procedure, procedureWithPermissions, router } from '../trpc/trpc.js';
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

export default router({
  createObservationsFromCapture: procedureWithPermissions('capture')
    .input(z.object({ captureId: z.number(), observations: z.array(ObservationPayload) }))
    .mutation(async ({ input }) => {
      return await createObservationsFromCapture(input.captureId, input.observations);
    }),

  notifyDiscordAboutObservation: procedureWithPermissions('capture')
    .input(z.object({ observationId: z.number() }))
    .mutation(async ({ input }) => {
      return await notifyDiscordAboutObservation(input.observationId);
    }),

  delete: procedureWithPermissions('moderate')
    .input(z.object({ observationId: z.number() }))
    .mutation(async ({ input }) => {
      return await deleteObservation(input.observationId);
    }),

  locate: procedureWithPermissions('capture')
    .input(z.object({ id: z.number(), location: z.object({ x: z.number(), y: z.number() }) }))
    .mutation(async ({ input }) => {
      return await locateObservation(input.id, input.location);
    }),

  merge: procedureWithPermissions('moderate')
    .input(z.object({ targetObservationId: z.number(), sourceObservationIds: z.array(z.number()).min(1) }))
    .mutation(async ({ input }) => {
      return await mergeObservations(input.targetObservationId, input.sourceObservationIds);
    }),

  list: procedure.input(z.object({ meta: Pagination, query: Query.optional() })).query(async ({ input }) => {
    const user = useUser();
    const count = await getObservationCount();
    let data = await getObservations(input.meta, input.query);

    // Fog of war: hide feedback from users who haven't given feedback yet
    // in order to avoid existing votes influencing new votes
    const hasGivenFeedback = data.some(observation =>
      observation.identifications.some(identification =>
        identification.feedback.some(feedback => feedback.userId === user.id)
      )
    );

    if (!hasGivenFeedback) {
      data = data.map(observation => ({
        ...observation,
        identifications: observation.identifications.map(identification => ({
          ...identification,
          feedback: []
        }))
      }));
    }

    return {
      meta: {
        ...input.meta,
        total: count
      },
      data
    };
  }),

  unconfirmedCount: procedure.query(async () => {
    return await getUnconfirmedObservationCount();
  })
});
