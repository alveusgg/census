import { cache, router } from '../trpc/trpc.js';

import { z } from 'zod';
import { getCurrentSeason, getShiniesForSeason } from '../services/seasons/season.js';
import { procedure } from '../trpc/trpc.js';

export default router({
  current: procedure.use(cache.query({ key: ['seasons', 'current'], ttl: 300 })).query(async () => {
    return getCurrentSeason();
  }),
  shinies: procedure
    .input(z.object({ seasonId: z.number().optional() }))
    .use(
      cache.query({
        key: ({ input }) => ['seasons', 'shinies', input.seasonId ?? 'current'],
        ttl: 300
      })
    )
    .query(async ({ input }) => {
      if (!input.seasonId) {
        const season = await getCurrentSeason();
        return getShiniesForSeason(season.id);
      }
      return getShiniesForSeason(input.seasonId);
    })
});
