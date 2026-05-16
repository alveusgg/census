import { z } from 'zod';
import { subscribeToChanges } from '../db/listen.js';
import { getRecentRedeemedAchievements } from '../services/points/achievement.js';
import { getLeaderboard, getLeaderboardPage } from '../services/points/points.js';
import { getCurrentSeason } from '../services/seasons/season.js';
import { getUserIdentifications, getUserPublicProfile, getUsers } from '../services/users/index.js';
import { procedure, procedureWithPermissions, router } from '../trpc/trpc.js';
import { Pagination } from './observation.js';
import { useUser } from '../utils/env/env.js';
import { updateStickerPositionsForUser } from '../services/users/index.js';

export default router({
  users: procedureWithPermissions('moderate').query(async () => {
    return await getUsers();
  }),

  profile: procedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
    return getUserPublicProfile(input.id);
  }),

  identifications: procedure
    .input(z.object({ id: z.number().int().positive(), meta: Pagination }))
    .query(async ({ input }) => {
      return getUserIdentifications(input.id, input.meta.page, input.meta.size);
    }),

  updateStickerPositions: procedure.input(z.object({ positions: z.unknown() })).mutation(async ({ input }) => {
    const user = useUser();
    return await updateStickerPositionsForUser(user.id, input.positions);
  }),

  leaderboard: procedure.input(z.object({ from: z.date().optional() })).query(async ({ input }) => {
    if (!input.from) {
      const season = await getCurrentSeason();
      return await getLeaderboard(season.startDate, { limit: 3 });
    }
    return await getLeaderboard(input.from, { limit: 3 });
  }),
  leaderboardPage: procedure
    .input(z.object({ from: z.date().optional(), meta: Pagination, offset: z.number().default(0) }))
    .query(async ({ input }) => {
      if (!input.from) {
        const season = await getCurrentSeason();
        return await getLeaderboardPage(season.startDate, input.meta.page, input.meta.size, input.offset);
      }

      return await getLeaderboardPage(input.from, input.meta.page, input.meta.size, input.offset);
    }),
  recentAchievements: procedure.query(async () => {
    return await getRecentRedeemedAchievements(7);
  }),
  live: {
    recentAchievements: procedure.subscription(async function* () {
      yield await getRecentRedeemedAchievements(7);

      for await (const _ of subscribeToChanges({ table: 'achievements', events: ['insert', 'update'] })) {
        yield await getRecentRedeemedAchievements(7);
      }
    })
  }
});
