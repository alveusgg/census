import { z } from 'zod';
import { getPermissions } from '../services/auth/role.js';
import {
  getAllAchievements,
  getPendingAchievements,
  redeemAchievementAndAwardPoints,
  redeemAll
} from '../services/points/achievement.js';
import { getPointsForUser } from '../services/points/points.js';
import { procedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export default router({
  points: procedure.query(async () => {
    const user = useUser();
    return getPointsForUser(user.twitchUserId);
  }),
  achievements: {
    pending: procedure.query(async () => {
      const user = useUser();
      return getPendingAchievements(user.twitchUserId);
    }),
    all: procedure.query(async () => {
      const user = useUser();
      return getAllAchievements(user.twitchUserId);
    }),
    redeem: procedure.input(z.number()).mutation(async ({ input, ctx }) => {
      const user = useUser();
      const points = await redeemAchievementAndAwardPoints(user.twitchUserId, input);
      ctx.points(points);
    }),
    redeemAll: procedure.mutation(async ({ ctx }) => {
      const user = useUser();
      const points = await redeemAll(user.twitchUserId);
      ctx.points(points);
      ctx.achievements();
    })
  },
  permissions: procedure.query(async () => {
    const user = useUser();
    return getPermissions(user.twitchUserId);
  })
});
