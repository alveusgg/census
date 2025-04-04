import { desc, eq } from 'drizzle-orm';

import { OnboardingFormSchema } from '@alveusgg/census-forms';
import { NotAuthenticatedError } from '@alveusgg/error';
import { Role, users } from '../../db/schema/index.js';
import { responses } from '../../db/schema/responses.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { recordAchievement } from '../points/achievement.js';

export const getUsers = async () => {
  const db = useDB();
  return db.select().from(users).orderBy(desc(users.createdAt));
};

export const promoteUser = async (id: number, role: Role) => {
  const db = useDB();
  await db.update(users).set({ role }).where(eq(users.id, id));
};

export const getUser = async (id: number) => {
  const db = useDB();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotAuthenticatedError('User not found');
  return user;
};

export const getOrCreateUserFromTwitchId = async (twitchUserId: string, username: string) => {
  const db = useDB();
  const tx = await db.transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.twitchUserId, twitchUserId));
    if (!user) {
      const [user] = await tx.insert(users).values({ twitchUserId, username, role: 'pending' }).returning();
      return user;
    }
    return user;
  });
  return tx;
};

export const updateUsername = async (id: number, username: string) => {
  const db = useDB();
  await db.update(users).set({ username }).where(eq(users.id, id));
};

export const onboardUser = async (id: number, data: OnboardingFormSchema) => {
  const db = useDB();
  return await db.transaction(async tx => {
    return await withTransaction(tx, async () => {
      await tx.update(users).set({ role: 'capturer' }).where(eq(users.id, id));
      await recordAchievement('onboard', id, { message: 'You signed up to the Alveus Pollinator Census!' }, true);
      await recordAchievement('onboard', id, { message: 'Click to redeem your first achievement!' });
      await tx.insert(responses).values({ userId: id, type: 'onboarding', payload: data });
    });
  });
};
