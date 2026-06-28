import { levels } from '@alveusgg/census-levels';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { defineListener } from '../db/defineListener.js';
import { achievements, users as usersTable } from '../db/schema/index.js';
import { useDB } from '../db/transaction.js';
import { getRecentRedeemedAchievements } from '../services/points/achievement.js';
import { getLevelForPoints, type Level } from '../services/points/level.js';
import { getLeaderboard, getLeaderboardPage } from '../services/points/points.js';
import { getCurrentSeason } from '../services/seasons/season.js';
import {
  getUserIdentifications,
  getUserPublicProfile,
  getUsers,
  updateStickerPositionsForUser
} from '../services/users/index.js';
import { cache, procedure, procedureWithPermissions, publicProcedure, router } from '../trpc/trpc.js';
import { useUser } from '../utils/env/env.js';
import { Pagination } from './observation.js';

interface UserLevelSnapshot {
  userId: number;
  username: string;
  points: number;
  level: Level;
}

interface LevelUpEvent {
  userId: number;
  username: string;
  points: number;
  level: Level;
}

const getUserLevelSnapshots = async (): Promise<UserLevelSnapshot[]> => {
  const db = useDB();
  const season = await getCurrentSeason();
  const rows = await db
    .select({
      userId: usersTable.id,
      username: usersTable.username,
      points: sql<number>`COALESCE(SUM(${achievements.points}), 0)`.mapWith(Number)
    })
    .from(usersTable)
    .leftJoin(
      achievements,
      and(
        eq(usersTable.id, achievements.userId),
        gte(achievements.createdAt, season.startDate),
        lte(achievements.createdAt, new Date()),
        eq(achievements.redeemed, true),
        eq(achievements.revoked, false)
      )
    )
    .where(eq(usersTable.status, 'active'))
    .groupBy(usersTable.id);

  return rows.map(row => ({
    ...row,
    level: getLevelForPoints(row.points)
  }));
};

export const createUsersRouter = () => {
  const recentAchievements = defineListener({
    changes: { table: 'achievements', events: ['insert', 'update'] },
    handler: () => getRecentRedeemedAchievements(7)
  });

  let knownLevels: Map<number, UserLevelSnapshot> | undefined;
  const levelUps = defineListener({
    changes: { table: 'achievements', events: ['insert', 'update'] },
    handler: async () => {
      const snapshots = await getUserLevelSnapshots();
      const previous = knownLevels;
      knownLevels = new Map(snapshots.map(snapshot => [snapshot.userId, snapshot]));

      if (!previous) return [];

      return snapshots
        .filter(snapshot => {
          const previousSnapshot = previous.get(snapshot.userId);
          const previousLevelNumber = previousSnapshot ? previousSnapshot.level : 'initial';
          return levels[snapshot.level].number > levels[previousLevelNumber].number;
        })
        .map<LevelUpEvent>(snapshot => ({
          userId: snapshot.userId,
          username: snapshot.username,
          points: snapshot.points,
          level: snapshot.level
        }));
    }
  });
  void levelUps.get().catch(error => {
    console.error('Failed to initialize level up listener', error);
  });

  return router({
    users: procedureWithPermissions('moderate')
      .use(cache.query({ key: ['users', 'list'], ttl: 60 }))
      .query(async () => {
        return await getUsers();
      }),

    profile: procedure
      .input(z.object({ id: z.number().int().positive() }))
      .use(cache.query({ key: ({ input }) => ['users', 'profile', input.id], ttl: 60 }))
      .query(async ({ input }) => {
        return getUserPublicProfile(input.id);
      }),

    identifications: procedure
      .input(z.object({ id: z.number().int().positive(), meta: Pagination }))
      .use(
        cache.query({
          key: ({ input }) => ['users', 'identifications', input.id, input.meta.page, input.meta.size],
          ttl: 60
        })
      )
      .query(async ({ input }) => {
        return getUserIdentifications(input.id, input.meta.page, input.meta.size);
      }),

    updateStickerPositions: procedure.input(z.object({ positions: z.unknown() })).mutation(async ({ input }) => {
      const user = useUser();
      const result = await updateStickerPositionsForUser(user.id, input.positions);
      cache.invalidate([
        ['users', 'list'],
        ['users', 'profile', user.id]
      ]);
      return result;
    }),

    leaderboard: procedure
      .input(z.object({ from: z.date().optional() }))
      .use(
        cache.query({
          key: ({ input }) => ['users', 'leaderboard', input.from?.toISOString() ?? 'current'],
          ttl: 60
        })
      )
      .query(async ({ input }) => {
        if (!input.from) {
          const season = await getCurrentSeason();
          return await getLeaderboard(season.startDate, { limit: 3 });
        }
        return await getLeaderboard(input.from, { limit: 3 });
      }),
    leaderboardPage: procedure
      .input(z.object({ from: z.date().optional(), meta: Pagination, offset: z.number().default(0) }))
      .use(
        cache.query({
          key: ({ input }) => [
            'users',
            'leaderboardPage',
            input.from?.toISOString() ?? 'current',
            input.meta.page,
            input.meta.size,
            input.offset
          ],
          ttl: 60
        })
      )
      .query(async ({ input }) => {
        if (!input.from) {
          const season = await getCurrentSeason();
          return await getLeaderboardPage(season.startDate, input.meta.page, input.meta.size, input.offset);
        }

        return await getLeaderboardPage(input.from, input.meta.page, input.meta.size, input.offset);
      }),
    // Keep this public with the matching SSE subscription; see docs/dev/api/sse-subscriptions.md.
    recentAchievements: publicProcedure.query(async () => {
      return await recentAchievements.get();
    }),
    live: {
      // Public because EventSource reconnects can reuse stale auth; see docs/dev/api/sse-subscriptions.md.
      recentAchievements: publicProcedure.subscription(async function* ({ signal }) {
        yield* recentAchievements.subscribe({ signal });
      }),
      // Public because this powers the unauthenticated overlay route.
      levelUps: publicProcedure.subscription(async function* ({ signal }) {
        yield* levelUps.subscribe({ signal });
      })
    }
  });
};
