import { AnyAchievementPayload, levels } from '@alveusgg/census-levels';
import { NotFoundError } from '@alveusgg/error';
import { formatDistanceStrict, subDays } from 'date-fns';
import { and, desc, eq, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { achievements, identifications, observations, sightings, users } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { getLevelForPoints } from '../points/level.js';
import { getPlaceInLeaderboard, getPointsForUser } from '../points/points.js';

interface IdentificationSummary {
  nickname: string;
}

interface ObservationSummary {
  observedAt: Date;
}

interface AchievementSummary {
  payload: AnyAchievementPayload;
  identification: IdentificationSummary | null;
}

export interface ProfileActivitySummary {
  confirmedIdentification?: IdentificationSummary;
  observation?: ObservationSummary;
  suggestion?: IdentificationSummary;
  achievement?: AchievementSummary;
}

export interface UserProfileSummary {
  username: string;
  level: number;
  pointsLast7Days: number;
  rankLast7Days: number | null;
  additional: string;
}

export const describeProfileAchievement = (achievement: AchievementSummary) => {
  const target = achievement.identification?.nickname;

  switch (achievement.payload.type) {
    case 'onboard':
      return achievement.payload.payload.publicMessage ?? 'joined the census';
    case 'identify':
      return target ? `identified ${target}` : 'made an identification';
    case 'assist':
      return target ? `assisted on ${target}` : 'assisted an identification';
    case 'shiny':
      return target ? `found a shiny ${target}` : 'found a shiny';
    case 'vote':
      return target ? `voted on ${target}` : 'voted on an identification';
    case 'comment':
      return target ? `commented on ${target}` : 'commented on an identification';
    case 'observe':
      return 'submitted a clip!';
    default:
      return 'earned an achievement';
  }
};

export const selectAdditionalProfileSummary = (activity: ProfileActivitySummary, now = new Date()) => {
  if (activity.confirmedIdentification) {
    return `last identification: ${activity.confirmedIdentification.nickname}`;
  }

  if (activity.observation) {
    const relativeTime = formatDistanceStrict(activity.observation.observedAt, now, { addSuffix: true });
    return `last observation: ${relativeTime}`;
  }

  if (activity.suggestion) {
    return `last suggestion: ${activity.suggestion.nickname}`;
  }

  const description = activity.achievement ? describeProfileAchievement(activity.achievement) : 'earned an achievement';
  return `last achievement: ${description}`;
};

export const getUserProfileSummary = async (username: string, now = new Date()): Promise<UserProfileSummary> => {
  const db = useDB();
  const [user] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(and(eq(users.status, 'active'), sql`lower(${users.username}) = lower(${username})`))
    .limit(1);

  if (!user) throw new NotFoundError(`User not found: ${username}`);

  const primaryIdentification = or(eq(identifications.isAccessory, false), isNull(identifications.isAccessory));
  const validSuggestion = and(
    eq(identifications.suggestedBy, user.id),
    isNull(identifications.deletedAt),
    primaryIdentification
  );

  const sevenDaysAgo = subDays(now, 7);
  const [totalPoints, weeklyPlace, confirmedIdentifications, latestObservations, suggestions, userAchievements] =
    await Promise.all([
      getPointsForUser(user.id, undefined, now),
      getPlaceInLeaderboard(user.id, sevenDaysAgo, now),
      db
        .select({ nickname: identifications.nickname })
        .from(identifications)
        .where(and(validSuggestion, isNotNull(identifications.confirmedBy)))
        .orderBy(desc(identifications.id))
        .limit(1),
      db
        .select({ observedAt: sightings.observedAt })
        .from(sightings)
        .innerJoin(observations, eq(sightings.observationId, observations.id))
        .where(and(eq(sightings.observedBy, user.id), eq(observations.removed, false)))
        .orderBy(desc(sightings.observedAt), desc(sightings.id))
        .limit(1),
      db
        .select({ nickname: identifications.nickname })
        .from(identifications)
        .where(validSuggestion)
        .orderBy(desc(identifications.id))
        .limit(1),
      db
        .select({
          payload: achievements.payload,
          identification: {
            nickname: identifications.nickname
          }
        })
        .from(achievements)
        .leftJoin(identifications, eq(achievements.identificationId, identifications.id))
        .where(and(eq(achievements.userId, user.id), eq(achievements.redeemed, true), eq(achievements.revoked, false)))
        .orderBy(desc(achievements.createdAt), desc(achievements.id))
        .limit(1)
    ]);

  const level = getLevelForPoints(totalPoints);
  return {
    username: user.username,
    level: levels[level].number,
    pointsLast7Days: weeklyPlace.me?.points ?? 0,
    rankLast7Days: weeklyPlace.me ? weeklyPlace.place : null,
    additional: selectAdditionalProfileSummary(
      {
        confirmedIdentification: confirmedIdentifications[0],
        observation: latestObservations[0],
        suggestion: suggestions[0],
        achievement: userAchievements[0]
      },
      now
    )
  };
};
