import { eq, sql } from 'drizzle-orm';
import { users } from '../../db/schema';
import { useDB } from '../../db/transaction';

export const getPointsForUser = async (username: string) => {
  const db = useDB();
  const user = await db.query.users.findFirst({ where: eq(users.username, username), columns: { points: true } });
  if (!user) throw new Error(`User not found: ${username}`);
  return user.points;
};

export const addPoints = async (username: string, points: number) => {
  const db = useDB();
  const [user] = await db
    .update(users)
    .set({ points: sql`${users.points} + ${points}` })
    .where(eq(users.username, username))
    .returning({ points: users.points });
  return user.points;
};

export const removePoints = async (username: string, points: number) => {
  const db = useDB();
  return await db
    .update(users)
    .set({ points: sql`${users.points} - ${points}` })
    .where(eq(users.username, username))
    .returning({ points: users.points });
};
