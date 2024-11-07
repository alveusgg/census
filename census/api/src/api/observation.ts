import { z } from 'zod';
import { createObservationsFromCapture, ObservationPayload } from '../services/observations/observations.js';
import { editorProcedure, router } from '../trpc/trpc.js';

export default router({
  createObservationsFromCapture: editorProcedure
    .input(z.object({ captureId: z.number(), observations: z.array(ObservationPayload) }))
    .mutation(async ({ input }) => {
      return await createObservationsFromCapture(input.captureId, input.observations);
    })
});
