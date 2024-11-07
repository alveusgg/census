import z from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import { completeCaptureRequest, getCapture } from '../services/capture/index.js';
import { integrationProcedure, router } from '../trpc/trpc.js';
import { getCreateOnlySasURL } from '../utils/storage.js';

export default router({
  subscribeToRequestsForFeed: integrationProcedure
    .input(z.object({ feedId: z.string() }))
    .subscription(async function* ({ input }) {
      for await (const change of subscribeToChanges({ table: 'captures', events: ['insert'] })) {
        const request = await getCapture(change.id);
        if (request.feedId !== input.feedId || request.status !== 'pending') break;

        const creds = await getCreateOnlySasURL();
        yield { request, meta: { creds } };
      }
    }),

  completeCaptureRequest: integrationProcedure
    .input(z.object({ captureId: z.number(), videoUrl: z.string() }))
    .mutation(async ({ input }) => {
      await completeCaptureRequest(input.captureId, input.videoUrl);
    })
});
