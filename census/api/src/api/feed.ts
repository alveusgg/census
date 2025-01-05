import z from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import { completeCaptureRequest, getCapture, getPendingCapturesForFeeds } from '../services/capture/index.js';
import { ensureKeyForFeeds } from '../services/feed/index.js';
import { publicProcedure, router } from '../trpc/trpc.js';
import { getCreateOnlySasURL } from '../utils/storage.js';

export default router({
  subscribeToRequestsForFeed: publicProcedure
    .input(z.object({ feeds: z.string().array(), key: z.string() }))
    .subscription(async function* ({ input }) {
      try {
        const targets = await ensureKeyForFeeds(input.feeds, input.key);

        yield { type: 'started' as const };

        const pendingCaptures = await getPendingCapturesForFeeds(targets);
        for (const request of pendingCaptures) {
          const creds = await getCreateOnlySasURL();
          yield { type: 'data' as const, request, meta: { creds } };
        }

        for await (const change of subscribeToChanges({ table: 'captures', events: ['insert'] })) {
          const request = await getCapture(change.id);
          if (!targets.includes(request.feedId) || request.status !== 'pending') break;

          const creds = await getCreateOnlySasURL();
          yield { type: 'data' as const, request, meta: { creds } };
        }
        yield { type: 'complete' as const };
      } catch (error) {
        yield { type: 'error' as const, error };
      }
    }),

  completeCaptureRequest: publicProcedure
    .input(z.object({ captureId: z.number(), videoUrl: z.string(), key: z.string() }))
    .mutation(async ({ input }) => {
      const capture = await getCapture(input.captureId);
      await ensureKeyForFeeds([capture.feedId], input.key);
      await completeCaptureRequest(input.captureId, input.videoUrl);
    })
});
