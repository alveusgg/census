import { eq, sql } from 'drizzle-orm';
import { users } from '../../db/schema';
import { useDB } from '../../db/transaction';

export const getPointsForUser = async (twitchUserId: string) => {
  const db = useDB();
  const user = await db.query.users.findFirst({ where: eq(users.twitchUserId, twitchUserId), columns: { points: true } });
  if (!user) throw new Error(`User not found: ${twitchUserId}`);
  return user.points;
};

export const addPoints = async (twitchUserId: string, points: number) => {
  const db = useDB();
  const [user] = await db
    .update(users)
    .set({ points: sql`${users.points} + ${points}` })
    .where(eq(users.twitchUserId, twitchUserId))
    .returning({ points: users.points });
  return user.points;
};

export const removePoints = async (twitchUserId: string, points: number) => {
  const db = useDB();
  return await db
    .update(users)
    .set({ points: sql`${users.points} - ${points}` })
    .where(eq(users.twitchUserId, twitchUserId))
    .returning({ points: users.points });
};
