import { AchievementPayload, Actions, AnyAchievementPayload, registry } from '@alveusgg/census-levels';
import { NotFoundError } from '@alveusgg/error';
import { and, eq, inArray } from 'drizzle-orm';
import { achievements } from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { getPointsForUser } from './points.js';

export const recordAchievement = async <A extends Actions>(
  action: A,
  userId: number,
  payload: AchievementPayload<A>['payload'],
  immediate = false
) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      await addAchievement(action, userId, payload, immediate);
      return await getPointsForUser(userId);
    })
  );
};

export const redeemAchievementAndAwardPoints = async (userId: number, id: number) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      await redeemAchievement(userId, id);
      return await getPointsForUser(userId);
    })
  );
};

export const redeemAll = async (userId: number) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const pending = await tx
        .select({ id: achievements.id, points: achievements.points })
        .from(achievements)
        .where(and(eq(achievements.userId, userId), eq(achievements.redeemed, false), eq(achievements.revoked, false)));

      await tx
        .update(achievements)
        .set({ redeemed: true })
        .where(
          inArray(
            achievements.id,
            pending.map(p => p.id)
          )
        );

      return await getPointsForUser(userId);
    })
  );
};

export const revokeAchievement = async (id: number) => {
  const db = useDB();
  await db.transaction(async tx =>
    withTransaction(tx, async () => {
      await removeAchievement(id);
    })
  );
};

const addAchievement = async <A extends Actions>(
  action: A,
  userId: number,
  payload: AchievementPayload<A>['payload'],
  immediate = false
) => {
  const db = useDB();
  const details = registry[action];
  assert(details, `Invalid action: ${action}`);
  const parsed = details.schema.parse(payload);

  await db.insert(achievements).values({
    type: action,
    userId,
    points: details.points,
    payload: { type: action, payload: parsed } as AnyAchievementPayload,
    identificationId: 'identificationId' in parsed ? parsed.identificationId : null,
    redeemed: immediate
  });
};

const redeemAchievement = async (userId: number, id: number) => {
  const db = useDB();
  const [entry] = await db.update(achievements).set({ redeemed: true }).where(eq(achievements.id, id)).returning();
  if (!entry) throw new NotFoundError(`Achievement not found: ${id}`);
  if (entry.userId !== userId) throw new NotFoundError(`Achievement not owned by user: ${id}`);
  return entry;
};

export const getPendingAchievements = async (userId: number) => {
  const db = useDB();
  return await db.query.achievements.findMany({
    where: and(eq(achievements.userId, userId), eq(achievements.redeemed, false), eq(achievements.revoked, false)),
    with: {
      identification: true,
      observation: true
    }
  });
};

export const getAllAchievements = async (userId: number) => {
  const db = useDB();
  return await db.query.achievements.findMany({ where: eq(achievements.userId, userId) });
};

const removeAchievement = async (id: number) => {
  const db = useDB();
  await db.update(achievements).set({ revoked: true }).where(eq(achievements.id, id));
};
