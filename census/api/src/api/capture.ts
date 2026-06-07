import { z } from 'zod';
import { defineListener, defineParameterizedListener } from '../db/defineListener.js';
import {
  createFromClip,
  getCapture,
  getCaptureCount,
  getCaptures,
  getUnconvertedCapturesForUser,
  markCaptureDeadForUser
} from '../services/capture/index.js';
import { cache, procedure, procedureWithPermissions, publicProcedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';
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

  unconvertedCaptures: procedure.query(async () => {
    const user = useUser();
    return await getUnconvertedCapturesForUser(user.id);
  }),

  markDead: procedureWithPermissions('capture')
    .input(z.object({ id: z.number() }))
    .use(cache.mutation({ key: ['captures'] }))
    .mutation(async ({ input }) => {
      const user = useUser();
      return await markCaptureDeadForUser(input.id, user.id);
    }),

  createFromClip: procedureWithPermissions('capture')
    .input(z.object({ id: z.string(), userIsVerySureItIsNeeded: z.boolean().optional() }))
    .use(cache.mutation({ key: ['captures'] }))
    .mutation(async ({ input }) => {
      const clip = await createFromClip(input.id, input.userIsVerySureItIsNeeded);
      return clip;
    })
});
