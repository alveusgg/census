import { AchievementPayload, Actions, AnyAchievementPayload, registry } from '@alveusgg/census-levels';
import { NotFoundError } from '@alveusgg/error';
import { and, eq, inArray } from 'drizzle-orm';
import { Achievement, achievements, identifications, shinies } from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { assert } from '../../utils/assert.js';
import { useUser } from '../../utils/env/env.js';
import { metric } from '../../utils/logs.js';
import { getCurrentSeason, getRawShiniesForSeason } from '../seasons/season.js';

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
    })
  );
};

export const redeemAchievementAndAwardPoints = async (userId: number, id: number) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      metric('achievement_redeemed', 1);
      await redeemAchievement(userId, id);
    })
  );
};

const checkForSideEffects = async (achievements: Achievement[]) => {
  const db = useDB();
  const user = useUser();
  for (const achievement of achievements) {
    if (achievement.type === 'identify' && achievement.identificationId) {
      const season = await getCurrentSeason();
      const shiniesForSeason = await getRawShiniesForSeason(season.id);
      const identification = await db.query.identifications.findFirst({
        where: eq(identifications.id, achievement.identificationId)
      });
      if (!identification) continue;
      if (shiniesForSeason.some(shiny => shiny.inatId.toString() === identification.sourceId)) {
        await addAchievement('shiny', user.id, { identificationId: achievement.identificationId });
        user.achievements();
      }
    }

    if (achievement.type === 'shiny' && achievement.identificationId) {
      metric('shiny_identified', 1);
      const season = await getCurrentSeason();
      const shiniesForSeason = await getRawShiniesForSeason(season.id);

      const identification = await db.query.identifications.findFirst({
        where: eq(identifications.id, achievement.identificationId)
      });
      if (!identification) continue;
      const shiny = shiniesForSeason.find(shiny => shiny.inatId.toString() === identification.sourceId);
      if (!shiny) continue;
      if (shiny.seasonId !== season.id) continue;
      metric('shiny_identified', 1);

      await db
        .update(shinies)
        .set({
          identificationId: achievement.identificationId
        })
        .where(eq(shinies.id, shiny.id));

      await db
        .update(identifications)
        .set({
          shinyId: shiny.id
        })
        .where(eq(identifications.id, achievement.identificationId));
      user.achievements();
    }
  }
};

export const redeemAll = async (userId: number) => {
  const db = useDB();
  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const pending = await tx
        .select()
        .from(achievements)
        .where(and(eq(achievements.userId, userId), eq(achievements.redeemed, false), eq(achievements.revoked, false)));

      metric('achievement_redeemed', pending.length);
      await checkForSideEffects(pending);

      await tx
        .update(achievements)
        .set({ redeemed: true })
        .where(
          inArray(
            achievements.id,
            pending.map(p => p.id)
          )
        );
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
  await checkForSideEffects([entry]);

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
