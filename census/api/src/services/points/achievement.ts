import { and, eq, inArray } from 'drizzle-orm';
import { achievements } from '../../db/schema';
import { useDB, withTransaction } from '../../db/transaction';
import { addPoints, removePoints } from './points';

type AchievementDetails = { points: number };
type Registry = Record<string, AchievementDetails>;

const registry = {
  vote: { points: 1 }
} satisfies Registry;

export type Achievements = keyof typeof registry;

export const recordAchievement = async (action: Achievements, username: string, immediate = false) => {
  const details = registry[action];
  if (!details) throw new Error(`Invalid action: ${action}`);
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      await addAchievement(action, username, details.points, immediate);
      if (immediate) return await addPoints(username, details.points);
    })
  );
};

export const redeemAchievementAndAwardPoints = async (username: string, id: number) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const achievement = await redeemAchievement(username, id);
      return await addPoints(achievement.username, achievement.points);
    })
  );
};

export const redeemAll = async (username: string) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const pending = await tx
        .select({ id: achievements.id, points: achievements.points })
        .from(achievements)
        .where(
          and(eq(achievements.username, username), eq(achievements.redeemed, false), eq(achievements.revoked, false))
        );

      await tx
        .update(achievements)
        .set({ redeemed: true })
        .where(
          inArray(
            achievements.id,
            pending.map(p => p.id)
          )
        );

      const points = pending.reduce((acc, curr) => acc + curr.points, 0);
      return await addPoints(username, points);
    })
  );
};

export const revokeAchievement = async (id: number) => {
  const db = useDB();
  await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const entry = await getAchievement(id);
      await removeAchievement(id);
      await removePoints(entry.username, entry.points);
    })
  );
};

const addAchievement = async (action: Achievements, username: string, points: number, immediate = false) => {
  const db = useDB();
  await db.insert(achievements).values({ type: action, username, points, redeemed: immediate });
};

const redeemAchievement = async (username: string, id: number) => {
  const db = useDB();
  const [entry] = await db.update(achievements).set({ redeemed: true }).where(eq(achievements.id, id)).returning();
  if (!entry) throw new Error(`Achievement not found: ${id}`);
  if (entry.username !== username) throw new Error(`Achievement not owned by user: ${id}`);
  return entry;
};

export const getPendingAchievements = async (username: string) => {
  const db = useDB();
  return await db.query.achievements.findMany({
    where: and(eq(achievements.username, username), eq(achievements.redeemed, false), eq(achievements.revoked, false)),
    with: {
      identification: true,
      observation: true
    }
  });
};

export const getAllAchievements = async (username: string) => {
  const db = useDB();
  return await db.query.achievements.findMany({ where: eq(achievements.username, username) });
};

const getAchievement = async (id: number) => {
  const db = useDB();
  const entry = await db.query.achievements.findFirst({ where: eq(achievements.id, id) });
  if (!entry) throw new Error(`Achievement not found: ${id}`);
  return entry;
};

const removeAchievement = async (id: number) => {
  const db = useDB();
  await db.update(achievements).set({ revoked: true }).where(eq(achievements.id, id));
};
