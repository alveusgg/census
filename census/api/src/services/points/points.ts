import { NotFoundError } from '@alveusgg/error';
import { and, asc, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { achievements, users } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';

interface LeaderboardQueryOptions {
  limit?: number;
  offset?: number;
}

const getLeaderboardBaseQuery = (from: Date) => {
  const db = useDB();
  return db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
      points: sql<number>`COALESCE(SUM(${achievements.points}), 0)`.mapWith(Number)
    })
    .from(users)
    .leftJoin(achievements, eq(users.id, achievements.userId))
    .where(
      and(
        eq(users.status, 'active'),
        gte(achievements.createdAt, from),
        lte(achievements.createdAt, new Date()),
        eq(achievements.redeemed, true),
        eq(achievements.revoked, false)
      )
    )
    .groupBy(users.id);
};

export const getPointsForUser = async (userId: number, from: Date) => {
  const db = useDB();
  const [user] = await db
    .select({ points: sum(achievements.points).mapWith(Number) })
    .from(achievements)
    .where(
      and(
        eq(achievements.userId, userId),
        eq(achievements.redeemed, true),
        gte(achievements.createdAt, from),
        eq(achievements.revoked, false)
      )
    );
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return user.points || 0;
};

export const getLeaderboard = async (from: Date, options: LeaderboardQueryOptions = {}) => {
  const query = getLeaderboardBaseQuery(from).orderBy(({ id, points }) => [desc(points), asc(id)]);

  if (options.limit !== undefined && options.offset !== undefined) {
    return query.limit(options.limit).offset(options.offset);
  }

  if (options.limit !== undefined) {
    return query.limit(options.limit);
  }

  if (options.offset !== undefined) {
    return query.offset(options.offset);
  }

  return query;
};

export const getLeaderboardCount = async (from: Date) => {
  const db = useDB();
  const leaderboard = getLeaderboardBaseQuery(from).as('leaderboard');
  const [result] = await db
    .select({
      total: sql<number>`count(*)`.mapWith(Number)
    })
    .from(leaderboard);

  return result?.total ?? 0;
};

export const getLeaderboardPage = async (from: Date, page: number, size: number, offset = 0) => {
  const pageOffset = offset + (page - 1) * size;
  const [data, total] = await Promise.all([
    getLeaderboard(from, { limit: size, offset: pageOffset }),
    getLeaderboardCount(from)
  ]);

  return {
    meta: {
      page,
      size,
      total
    },
    data: data.map((entry, index) => ({
      ...entry,
      place: pageOffset + index + 1
    }))
  };
};

export const getPlaceInLeaderboard = async (userId: number, from: Date) => {
  const leaderboard = await getLeaderboard(from);
  const index = leaderboard.findIndex(user => user.id === userId);
  return { place: index + 1, me: leaderboard[index] };
};
