import { z } from 'zod';
import { getLeaderboard } from '../services/points/points.js';
import { getUsers, promoteUser } from '../services/users/index.js';
import { procedure, procedureWithPermissions, router } from '../trpc/trpc.js';

export default router({
  users: procedureWithPermissions('moderate').query(async () => {
    return await getUsers();
  }),

  promoteUser: procedureWithPermissions('admin')
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(['admin', 'moderator', 'researcher', 'expert'])
      })
    )
    .mutation(async ({ input }) => {
      return await promoteUser(input.userId, input.role);
    }),

  leaderboard: procedure.input(z.object({ from: z.date() })).query(async ({ input }) => {
    return await getLeaderboard(input.from);
  })
});
