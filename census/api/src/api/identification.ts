import { z } from 'zod';
import { recordAchievement } from '../services/points/achievement.js';
import { procedure, router } from '../trpc/trpc';

export default router({
  vote: procedure
    .input(
      z.object({
        id: z.string(),
        vote: z.enum(['up', 'down']),
        comment: z.string().optional()
      })
    )
    .mutation(async ({ input, ctx }) => {
      const points = await recordAchievement('vote', ctx.user);
      ctx.points(points);
    })
});
