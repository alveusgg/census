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
import { getPointsForUser } from '../services/points/points.js';
import { getUser, onboardUser } from '../services/users/index.js';
import { procedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';

export default router({
  onboard: procedure.input(OnboardingFormSchema).mutation(async ({ input, ctx }) => {
    const { id } = useUser();
    const user = await getUser(id);
    if (user.role !== 'pending') throw new BadRequestError(`You have already been onboarded.`);
    const points = await onboardUser(id, input);
    ctx.points(points);
    ctx.achievements();
  }),
  points: procedure.query(async () => {
    const user = useUser();
    return getPointsForUser(user.id);
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
      const points = await redeemAchievementAndAwardPoints(user.id, input);
      ctx.points(points);
    }),
    redeemAll: procedure.mutation(async ({ ctx }) => {
      const user = useUser();
      const points = await redeemAll(user.id);
      ctx.points(points);
      ctx.achievements();
    })
  },
  permissions: procedure.query(async () => {
    const user = useUser();
    return getPermissions(user.id);
  })
});
