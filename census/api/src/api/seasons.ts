import { router } from '../trpc/trpc.js';

import { z } from 'zod';
import { getCurrentSeason, getShiniesForSeason } from '../services/seasons/season.js';
import { procedure } from '../trpc/trpc.js';

export default router({
  current: procedure.query(async () => {
    return getCurrentSeason();
  }),
  shinies: procedure.input(z.object({ seasonId: z.number().optional() })).query(async ({ input }) => {
    if (!input.seasonId) {
      const season = await getCurrentSeason();
      return getShiniesForSeason(season.id);
    }
    return getShiniesForSeason(input.seasonId);
  })
});
