import { z } from 'zod';
import { getLeaderboard } from '../services/points/points.js';
import { getCurrentSeason } from '../services/seasons/season.js';
import { getUsers } from '../services/users/index.js';
import { procedure, procedureWithPermissions, router } from '../trpc/trpc.js';

export default router({
  users: procedureWithPermissions('moderate').query(async () => {
    return await getUsers();
  }),

  leaderboard: procedure.input(z.object({ from: z.date().optional() })).query(async ({ input }) => {
    if (!input.from) {
      const season = await getCurrentSeason();
      return await getLeaderboard(season.startDate);
    }
    return await getLeaderboard(input.from);
  })
});
