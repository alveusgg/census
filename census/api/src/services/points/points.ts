import { NotFoundError } from '@alveusgg/error';
import { and, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { achievements, users } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';

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

export const getLeaderboard = async (from: Date) => {
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
        eq(users.banned, false),
        gte(achievements.createdAt, from),
        lte(achievements.createdAt, new Date()),
        eq(achievements.redeemed, true),
        eq(achievements.revoked, false)
      )
    )
    .groupBy(users.id)
    .orderBy(({ points }) => [desc(points)]);
};

export const getPlaceInLeaderboard = async (userId: number, from: Date) => {
  const leaderboard = await getLeaderboard(from);
  const index = leaderboard.findIndex(user => user.id === userId);
  return { place: index + 1, me: leaderboard[index] };
};
