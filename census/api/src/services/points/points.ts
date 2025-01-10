import { NotFoundError } from '@alveusgg/error';
import { and, eq, sum } from 'drizzle-orm';
import { achievements } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';

export const getPointsForUser = async (userId: number) => {
  const db = useDB();
  const [user] = await db
    .select({ points: sum(achievements.points).mapWith(Number) })
    .from(achievements)
    .where(and(eq(achievements.userId, userId), eq(achievements.redeemed, true)));
  if (!user) throw new NotFoundError(`User not found: ${userId}`);
  return user.points;
};
