import { OnboardingFormSchema } from '@alveusgg/census-forms';
import { BadRequestError, DownstreamError } from '@alveusgg/error';
import { LogsQueryResultStatus } from '@azure/monitor-query';
import { z } from 'zod';
import { metrics } from '../db/schema/metrics.js';
import { getPermissions } from '../services/auth/role.js';
import {
  getAllAchievements,
  getPendingAchievements,
  redeemAchievementAndAwardPoints,
  redeemAll
} from '../services/points/achievement.js';
import { getPlaceInLeaderboard, getPointsForUser } from '../services/points/points.js';
import { getUser, onboardUser } from '../services/users/index.js';
import { procedure, router } from '../trpc/trpc.js';
import { assert } from '../utils/assert.js';
import { useEnvironment, useUser } from '../utils/env/env.js';

export default router({
  onboard: procedure.input(OnboardingFormSchema).mutation(async ({ input, ctx }) => {
    const { id } = useUser();
    const user = await getUser(id);
    if (user.role !== 'pending') throw new BadRequestError(`You have already been onboarded.`);
    await onboardUser(id, input);
    ctx.points();
    ctx.achievements();
  }),
  points: procedure.input(z.object({ from: z.date() })).query(async ({ input }) => {
    const user = useUser();
    return getPointsForUser(user.id, input.from);
  }),
  place: procedure.input(z.object({ from: z.date() })).query(async ({ input }) => {
    const user = useUser();
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
    const user = useUser();
    return getPermissions(user.id);
  }),
  logs: procedure.query(async () => {
    const { logs, variables, db } = useEnvironment();
    assert(variables.WORKSPACE_ID, 'WORKSPACE_ID is not set');
    assert(logs, 'Logs client is not set');

    const result = await logs.queryWorkspace(
      variables.WORKSPACE_ID,
      `AppMetrics
        | extend UserId = toint(case(isnotempty(UserAuthenticatedId), UserAuthenticatedId, Properties['ai.user.authUserId']))
        | where isnotempty(UserId)
        | summarize Value = sum(Sum) by UserId, Name, bin(TimeGenerated, 1h)
      `,
      {
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24),
        endTime: new Date()
      }
    );

    if (result.status !== LogsQueryResultStatus.Success) throw new DownstreamError('monitor', 'Failed to fetch logs');
    if (result.tables.length === 0) throw new BadRequestError('No logs found');
    if (result.tables.length > 1) throw new BadRequestError('Multiple logs found');

    const table = result.tables[0];
    const rows = table.rows;
    await db
      .insert(metrics)
      .values(
        rows.map(([userId, name, timestamp, value]) => Event.parse({ userId, name, value, createdAt: timestamp }))
      )
      .onConflictDoNothing();
  })
});

const Event = z.object({
  userId: z.number(),
  name: z.string(),
  value: z.number(),
  createdAt: z.coerce.date()
});
