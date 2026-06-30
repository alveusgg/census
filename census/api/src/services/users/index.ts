import { and, count, desc, eq, isNotNull, isNull, or } from 'drizzle-orm';

import { OnboardingFormSchema } from '@alveusgg/census-forms';
import { NotAuthenticatedError, NotFoundError } from '@alveusgg/error';
import { feedback, identifications, users } from '../../db/schema/index.js';
import { anonymousResponses, responses } from '../../db/schema/responses.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { withCoalescing } from '../../utils/cache.js';
import { recordAchievement } from '../points/achievement.js';
import { getAllReachedLevelsForPoints } from '../points/level.js';
import { getPointsForUser } from '../points/points.js';

export const getUsers = async () => {
  const db = useDB();
  return db.select().from(users).orderBy(desc(users.createdAt));
};

export const getUser = async (id: number) => {
  const db = useDB();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user) throw new NotAuthenticatedError('User not found');
  return user;
};

export const getUserByProviderId = withCoalescing(
  async (providerId: string) => {
    const db = useDB();
    const [user] = await db.select().from(users).where(eq(users.providerId, providerId));
    if (!user) throw new NotAuthenticatedError('User not found');
    return user;
  },
  { key: (providerId: string) => providerId }
);

export const getOrCreateUserFromAuthProviderIdentity = async (providerId: string, username: string) => {
  const db = useDB();
  const tx = await db.transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.providerId, providerId));
    if (!user) {
      const [user] = await tx.insert(users).values({ providerId, username, status: 'pending' }).returning();
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

export const updateStickerPositionsForUser = async (id: number, positions: unknown) => {
  const db = useDB();
  await db.update(users).set({ stickers: positions }).where(eq(users.id, id));
};

export const getUserPublicProfile = async (id: number) => {
  const db = useDB();
  const [user] = await db
    .select({ id: users.id, username: users.username, createdAt: users.createdAt, stickers: users.stickers })
    .from(users)
    .where(eq(users.id, id));

  const points = await getPointsForUser(id);
  const levels = getAllReachedLevelsForPoints(points);
  if (!user) throw new NotFoundError(`User not found: ${id}`);
  return { user, points, levels };
};

export const getUserIdentifications = async (id: number, page: number, size: number) => {
  const db = useDB();
  const confirmedUserIdentification = and(
    eq(identifications.suggestedBy, id),
    isNotNull(identifications.confirmedBy),
    isNull(identifications.deletedAt),
    or(eq(identifications.isAccessory, false), isNull(identifications.isAccessory))
  );
  const [{ total }] = await db.select({ total: count() }).from(identifications).where(confirmedUserIdentification);

  const data = await db.query.identifications.findMany({
    where: confirmedUserIdentification,
    with: {
      suggester: true,
      feedback: {
        where: isNull(feedback.deletedAt),
        with: {
          submitter: true
        }
      },
      shiny: true,
      observation: {
        with: {
          sightings: {
            with: {
              images: true,
              observer: true,
              capture: {
                with: {
                  capturer: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: desc(identifications.id),
    limit: size,
    offset: (page - 1) * size
  });

  return {
    meta: { page, size, total },
    data
  };
};

export const onboardUser = async (id: number, data: OnboardingFormSchema, age: number) => {
  const db = useDB();
  return await db.transaction(async tx => {
    return await withTransaction(tx, async () => {
      await tx.update(users).set({ status: 'active' }).where(eq(users.id, id));
      await recordAchievement(
        'onboard',
        id,
        {
          payload: {
            message: 'You signed up to the Alveus Pollinator Census!',
            publicMessage: 'signed up for the census'
          }
        },
        true
      );
      await recordAchievement('onboard', id, {
        payload: {
          message: 'Click to redeem your first achievement!',
          publicMessage: 'redeemed their first achievement'
        }
      });
      await tx.insert(responses).values({ userId: id, type: 'onboarding', payload: data });
      await tx.insert(anonymousResponses).values({ type: 'onboarding', payload: { age } });
    });
  });
};
