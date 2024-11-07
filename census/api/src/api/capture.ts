import { z } from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import { completeCaptureRequest, createFromClip, getCapture } from '../services/capture/index.js';
import { downloadClip } from '../services/twitch/clips.js';
import { procedure, router } from '../trpc/trpc.js';

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
    }),

  addPoints: procedure.input(z.object({ points: z.number() })).mutation(async ({ input, ctx }) => {
    points += input.points;
    ctx.points(points);
    await new Promise(resolve => setTimeout(resolve, 300));
    return { hello: 'world' };
  })
});

let points = 0;
