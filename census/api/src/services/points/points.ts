import { eq, sql } from 'drizzle-orm';
import { users } from '../../db/schema';
import { useDB } from '../../db/transaction';

export const getPointsForUser = async (userId: number) => {
  const db = useDB();
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { points: true } });
  if (!user) throw new Error(`User not found: ${userId}`);
  return user.points;
};

export const addPoints = async (userId: number, points: number) => {
  const db = useDB();
  const [user] = await db
    .update(users)
    .set({ points: sql`${users.points} + ${points}` })
    .where(eq(users.id, userId))
    .returning({ points: users.points });
  return user.points;
};

export const removePoints = async (userId: number, points: number) => {
  const db = useDB();
  return await db
    .update(users)
    .set({ points: sql`${users.points} - ${points}` })
    .where(eq(users.id, userId))
    .returning({ points: users.points });
};
