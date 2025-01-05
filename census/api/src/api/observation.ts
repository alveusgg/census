import { z } from 'zod';
import { notifyDiscordAboutObservation } from '../services/discord/index.js';
import {
  createObservationsFromCapture,
  getObservationCount,
  getObservations,
  ObservationPayload
} from '../services/observations/observations.js';
import { editorProcedure, procedure, router } from '../trpc/trpc.js';

export const Pagination = z.object({
  page: z.number().default(1),
  size: z.number().default(30)
});

export type Pagination = z.infer<typeof Pagination>;

export const Query = z.object({
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional()
});

export type Query = z.infer<typeof Query>;

export default router({
  createObservationsFromCapture: editorProcedure
    .input(z.object({ captureId: z.number(), observations: z.array(ObservationPayload) }))
    .mutation(async ({ input }) => {
      return await createObservationsFromCapture(input.captureId, input.observations);
    }),

  notifyDiscordAboutObservation: procedure
    .input(z.object({ observationId: z.number() }))
    .mutation(async ({ input }) => {
      return await notifyDiscordAboutObservation(input.observationId);
    }),

  list: procedure.input(z.object({ meta: Pagination, query: Query.optional() })).query(async ({ input }) => {
    const count = await getObservationCount();
    const data = await getObservations(input.meta);
    return {
      meta: {
        ...input.meta,
        total: count
      },
      data
    };
  })
});
