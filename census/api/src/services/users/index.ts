import { eq } from 'drizzle-orm';

import { NotFoundError } from '@alveusgg/error';
import { users } from '../../db/schema';
import { useEnvironment } from '../../utils/env/env';

export const getUser = async (id: number) => {
  const { db } = useEnvironment();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const getUserFromTwitchId = async (twitchUserId: string) => {
  const { db } = useEnvironment();
  const [user] = await db.select().from(users).where(eq(users.twitchUserId, twitchUserId));
  if (!user) throw new NotFoundError('User not found');
  return user;
};

export const updateUsername = async (id: number, username: string) => {
  const { db } = useEnvironment();
  await db.update(users).set({ username }).where(eq(users.id, id));
};
