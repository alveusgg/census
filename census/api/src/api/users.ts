import { z } from 'zod';
import { getRecentRedeemedAchievements } from '../services/points/achievement.js';
import { getLeaderboard, getPointsForUser } from '../services/points/points.js';
import { getCurrentSeason } from '../services/seasons/season.js';
import { getUserPublicProfile, getUsers } from '../services/users/index.js';
import { procedure, procedureWithPermissions, router } from '../trpc/trpc.js';

export default router({
  users: procedureWithPermissions('moderate').query(async () => {
    return await getUsers();
  }),

  profile: procedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    const [user, season] = await Promise.all([getUserPublicProfile(input.id), getCurrentSeason()]);
    const points = await getPointsForUser(user.id, season.startDate);
    return { ...user, points };
  }),

  leaderboard: procedure.input(z.object({ from: z.date().optional() })).query(async ({ input }) => {
    if (!input.from) {
      const season = await getCurrentSeason();
      return await getLeaderboard(season.startDate);
    }
    return await getLeaderboard(input.from);
  }),
  recentAchievements: procedure.query(async () => {
    return await getRecentRedeemedAchievements(7);
  })
});
