import { OnboardingFormSchema } from '@alveusgg/census-forms';
import { BadRequestError } from '@alveusgg/error';
import { z } from 'zod';
import { getPermissions } from '../services/auth/role.js';
import {
  getAllAchievements,
  getPendingAchievements,
  redeemAchievementAndAwardPoints,
  redeemAll
} from '../services/points/achievement.js';
import { getPlaceInLeaderboard, getPointsForUser } from '../services/points/points.js';
import { getCurrentSeason } from '../services/seasons/season.js';
import { getUser, onboardUser } from '../services/users/index.js';
import { procedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export default router({
  me: procedure.query(async () => {
    const user = useUser();
    return user;
  }),
  onboard: procedure.input(OnboardingFormSchema).mutation(async ({ input, ctx }) => {
    const { id } = useUser();
    const user = await getUser(id);
    if (user.status !== 'pending') throw new BadRequestError(`You have already been onboarded.`);
    await onboardUser(id, input);
    ctx.points();
    ctx.achievements();
  }),
  points: procedure.input(z.object({ from: z.date().optional() })).query(async ({ input }) => {
    const user = useUser();
    if (!input.from) {
      const season = await getCurrentSeason();
      return getPointsForUser(user.id, season.startDate);
    }
    return getPointsForUser(user.id, input.from);
  }),
  place: procedure.input(z.object({ from: z.date().optional() })).query(async ({ input }) => {
    const user = useUser();
    if (!input.from) {
      const season = await getCurrentSeason();
      return getPlaceInLeaderboard(user.id, season.startDate);
    }
    return getPlaceInLeaderboard(user.id, input.from);
  }),
  achievements: {
    pending: procedure.query(async () => {
      const user = useUser();
      return getPendingAchievements(user.id);
    }),
    all: procedure.query(async () => {
      const user = useUser();
      return getAllAchievements(user.id);
    }),
    redeem: procedure.input(z.number()).mutation(async ({ input, ctx }) => {
      const user = useUser();
      await redeemAchievementAndAwardPoints(user.id, input);
      ctx.points();
    }),
    redeemAll: procedure.mutation(async ({ ctx }) => {
      const user = useUser();
      await redeemAll(user.id);
      ctx.points();
      ctx.achievements();
    })
  },
  permissions: procedure.query(async () => {
    return getPermissions();
  })
});
