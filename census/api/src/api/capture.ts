import { z } from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import {
  completeCaptureRequest,
  createFromClip,
  getCapture,
  getCaptureCount,
  getCaptures
} from '../services/capture/index.js';
import { downloadClip } from '../services/twitch/clips.js';
import { procedure, router } from '../trpc/trpc.js';
import { Pagination } from './observation.js';

export default router({
  capture: procedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return getCapture(input.id);
  }),
  live: {
    capture: procedure.input(z.object({ id: z.number() })).subscription(async function* ({ input }) {
      const capture = await getCapture(input.id);
      if (capture.status === 'complete') return;

      for await (const _ of subscribeToChanges({ table: 'captures', events: ['update'], id: input.id })) {
        const capture = await getCapture(input.id);
        yield capture;
        if (capture.status === 'complete') return;
      }
    })
  },

  captures: procedure.input(z.object({ meta: Pagination })).query(async ({ input }) => {
    const data = await getCaptures(input.meta);
    const count = await getCaptureCount();
    return {
      meta: { ...input.meta, total: count },
      data
    };
  }),

  createFromClip: procedure
    .input(z.object({ id: z.string(), userIsVerySureItIsNeeded: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      const clip = await createFromClip(input.id, input.userIsVerySureItIsNeeded);

      if (clip.result === 'success') {
        downloadClip(input.id).then(url => {
          completeCaptureRequest(clip.capture.id, url);
        });
      }
      return clip;
    })
});
