import { z } from 'zod';
import { defineListener, defineParameterizedListener } from '../db/defineListener.js';
import { requestClipFromCamManager } from '../services/cams/index.js';
import {
  completeCaptureRequest,
  createFromClip,
  failCaptureRequest,
  getCapture,
  getCaptureCount,
  getCaptures,
  processingCaptureRequest
} from '../services/capture/index.js';
import { cache, procedure, procedureWithPermissions, publicProcedure, router } from '../trpc/trpc.js';
import { report } from '../utils/logs.js';
import { Pagination } from './observation.js';

const captures = defineParameterizedListener({
  key: (id: number) => id.toString(),
  create: (id: number) =>
    defineListener({
      changes: { table: 'captures', id, events: ['update'] },
      handler: async ({ end }) => {
        const capture = await getCapture(id);

        if (capture.status === 'complete') {
          end.abort();
        }

        return capture;
      }
    })
});

export default router({
  // Keep this public with the matching SSE subscription; see docs/dev/api/sse-subscriptions.md.
  capture: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return await captures.get(input.id);
  }),
  live: {
    // Public because EventSource reconnects can reuse stale auth; see docs/dev/api/sse-subscriptions.md.
    capture: publicProcedure.input(z.object({ id: z.number() })).subscription(async function* ({ input, signal }) {
      yield* captures.subscribe(input.id, { signal });
    })
  },

  captures: procedure
    .input(z.object({ meta: Pagination }))
    .use(cache.query({ key: ({ input }) => ['captures', 'list', input.meta.page, input.meta.size], ttl: 30 }))
    .query(async ({ input }) => {
      const data = await getCaptures(input.meta);
      const count = await getCaptureCount();
      return {
        meta: { ...input.meta, total: count },
        data
      };
    }),

  createFromClip: procedureWithPermissions('capture')
    .input(z.object({ id: z.string(), userIsVerySureItIsNeeded: z.boolean().optional() }))
    .use(cache.mutation({ key: ['captures'] }))
    .mutation(async ({ input }) => {
      const clip = await createFromClip(input.id, input.userIsVerySureItIsNeeded);

      if (clip.result === 'success') {
        await processingCaptureRequest(clip.capture.id);
        requestClipFromCamManager(clip.capture.startCaptureAt, clip.capture.endCaptureAt)
          .then(async url => {
            await completeCaptureRequest(clip.capture.id, url);
            cache.invalidate([['captures']]);
          })
          .catch(async e => {
            await failCaptureRequest(clip.capture.id);
            cache.invalidate([['captures']]);
            report(e);
            console.error(e);
          });
      }
      return clip;
    })
});
