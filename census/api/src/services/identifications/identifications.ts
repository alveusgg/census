import { BadRequestError, ForbiddenError, NotFoundError } from '@alveusgg/error';
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm';
import {
  achievements,
  feedback,
  feedbackCommentEdits,
  feedbackCommentModerations,
  identifications,
  observations,
  shinies,
  type ConfirmationAnnotation
} from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { useUser } from '../../utils/env/env.js';
import { getPermissions } from '../auth/role.js';
import { getTaxaInfo } from '../inat/index.js';
import { getObservation } from '../observations/observations.js';
import { recordAchievement } from '../points/achievement.js';

type FeedbackType = 'agree' | 'disagree';
type FeedbackRecord = typeof feedback.$inferSelect;
type Identification = typeof identifications.$inferSelect;
type IdentificationAchievementType = 'vote' | 'comment' | 'assist' | 'identify' | 'shiny';

const activeIdentification = () => isNull(identifications.deletedAt);
const activeFeedback = () => isNull(feedback.deletedAt);
const isVoteFeedbackType = (type: FeedbackRecord['type']): type is FeedbackType =>
  type === 'agree' || type === 'disagree';

const revokeAchievementsForIdentifications = async (
  identificationIds: number[],
  types: IdentificationAchievementType[] = ['vote', 'comment', 'assist', 'identify', 'shiny']
) => {
  if (identificationIds.length === 0) return;

  const db = useDB();
  await db
    .update(achievements)
    .set({ revoked: true })
    .where(
      and(
        inArray(achievements.identificationId, identificationIds),
        inArray(achievements.type, types),
        eq(achievements.revoked, false)
      )
    );
};

const revokeFeedbackAchievements = async (entries: FeedbackRecord[]) => {
  const db = useDB();

  for (const entry of entries) {
    if (!isVoteFeedbackType(entry.type)) continue;

    const achievementTypes: ('vote' | 'comment')[] = [];
    const activeVoteFeedback = await db.query.feedback.findFirst({
      where: and(
        eq(feedback.userId, entry.userId),
        eq(feedback.identificationId, entry.identificationId),
        eq(feedback.type, entry.type),
        activeFeedback()
      ),
      columns: { id: true }
    });
    if (!activeVoteFeedback) achievementTypes.push('vote');

    if (entry.comment) {
      const activeCommentFeedback = await db.query.feedback.findFirst({
        where: and(
          eq(feedback.userId, entry.userId),
          eq(feedback.identificationId, entry.identificationId),
          eq(feedback.type, entry.type),
          activeFeedback(),
          isNotNull(feedback.comment)
        ),
        columns: { id: true }
      });
      if (!activeCommentFeedback) achievementTypes.push('comment');
    }

    if (achievementTypes.length === 0) continue;

    await db
      .update(achievements)
      .set({ revoked: true })
      .where(
        and(
          eq(achievements.userId, entry.userId),
          eq(achievements.identificationId, entry.identificationId),
          inArray(achievements.type, achievementTypes),
          eq(achievements.revoked, false)
        )
      );
  }
};

const softDeleteFeedbackRows = async (entries: FeedbackRecord[], options: { revokeAchievements?: boolean } = {}) => {
  if (entries.length === 0) return;

  const db = useDB();
  await db
    .update(feedback)
    .set({ deletedAt: new Date() })
    .where(
      inArray(
        feedback.id,
        entries.map(entry => entry.id)
      )
    );

  if (options.revokeAchievements ?? true) {
    await revokeFeedbackAchievements(entries);
  }
};

const moveFeedbackAchievements = async (
  entry: FeedbackRecord,
  identificationId: number,
  options: { includeComment: boolean }
) => {
  if (entry.identificationId === identificationId) return;

  const db = useDB();
  const achievementTypes: ('vote' | 'comment')[] = ['vote'];
  if (options.includeComment) achievementTypes.push('comment');

  await db
    .update(achievements)
    .set({ identificationId })
    .where(
      and(
        eq(achievements.userId, entry.userId),
        eq(achievements.identificationId, entry.identificationId),
        inArray(achievements.type, achievementTypes),
        eq(achievements.revoked, false)
      )
    );
};

const revokeCommentAchievements = async (entry: FeedbackRecord) => {
  const db = useDB();

  await db
    .update(achievements)
    .set({ revoked: true })
    .where(
      and(
        eq(achievements.type, 'comment'),
        eq(achievements.userId, entry.userId),
        eq(achievements.identificationId, entry.identificationId),
        eq(achievements.revoked, false)
      )
    );
};

export const suggestIdentification = async (observationId: number, iNatId: number) => {
  const source = await getTaxaInfo(iNatId);
  const parent = await getPossibleParentIdentifications(observationId, source.ancestor_ids, false);
  return createIdentification(observationId, iNatId, source.preferred_common_name ?? source.name, source.ancestor_ids, {
    parentIdentificationId: parent?.id
  });
};

export const suggestAccessoryIdentification = async (observationId: number, iNatId: number) => {
  const source = await getTaxaInfo(iNatId);
  const parent = await getPossibleParentIdentifications(observationId, source.ancestor_ids, true);
  return createIdentification(observationId, iNatId, source.preferred_common_name ?? source.name, source.ancestor_ids, {
    parentIdentificationId: parent?.id,
    isAccessory: true
  });
};

export const confirmIdentification = async (
  identificationId: number,
  comment: string,
  annotations: ConfirmationAnnotation[] = []
) => {
  const db = useDB();
  const user = useUser();
  return db.transaction(async tx => {
    return withTransaction(tx, async () => {
      const identification = await tx.query.identifications.findFirst({
        where: and(eq(identifications.id, identificationId), activeIdentification())
      });
      if (!identification) throw new NotFoundError('Identification not found');
      if (identification.confirmedBy) throw new BadRequestError('Identification already confirmed');

      await tx.update(identifications).set({ confirmedBy: user.id }).where(eq(identifications.id, identificationId));
      await tx.insert(feedback).values({
        identificationId,
        userId: user.id,
        type: 'confirm',
        comment: comment,
        annotations
      });
      if (!identification.isAccessory) {
        await tx
          .update(observations)
          .set({ confirmedAs: identification.id })
          .where(eq(observations.id, identification.observationId));
      }

      await recordAchievement('identify', identification.suggestedBy, { payload: { identificationId } });
      const parentIdentifications = await getParentIdentificationChain(identification);
      for (const parentIdentification of parentIdentifications) {
        await recordAchievement('assist', parentIdentification.suggestedBy, {
          payload: { identificationId: parentIdentification.id }
        });
      }
      user.achievements();
    });
  });
};

const getParentIdentificationChain = async (identification: Identification) => {
  const db = useDB();
  const parentIdentifications: Identification[] = [];
  const visitedIdentificationIds = new Set([identification.id]);
  let parentIdentificationId = identification.alternateForId;

  while (parentIdentificationId) {
    if (visitedIdentificationIds.has(parentIdentificationId)) break;
    visitedIdentificationIds.add(parentIdentificationId);

    const parentIdentification = await db.query.identifications.findFirst({
      where: and(
        eq(identifications.id, parentIdentificationId),
        eq(identifications.observationId, identification.observationId),
        identification.isAccessory
          ? eq(identifications.isAccessory, true)
          : sql`${identifications.isAccessory} is not true`,
        activeIdentification()
      )
    });
    if (!parentIdentification) break;

    parentIdentifications.push(parentIdentification);
    parentIdentificationId = parentIdentification.alternateForId;
  }

  return parentIdentifications;
};

export const getPossibleParentIdentifications = async (
  observationId: number,
  taxonIds: number[],
  isAccessory: boolean
) => {
  const db = useDB();
  const ids = taxonIds.map(id => id.toString());
  const possibleParents = await db
    .select()
    .from(identifications)
    .where(
      and(
        eq(identifications.observationId, observationId),
        activeIdentification(),
        isAccessory ? eq(identifications.isAccessory, true) : sql`${identifications.isAccessory} is not true`,
        inArray(identifications.sourceId, ids)
      )
    );

  if (possibleParents.length === 0) return undefined;
  if (possibleParents.length === 1) return possibleParents[0];

  // Find the parent with the closest ancestor ids
  const closestParent = possibleParents.reduce((closest, current) => {
    if (current.id === closest.id) return closest;

    const depthOfParentInTaxonIds = ids.findIndex(id => id === current.sourceId);
    const depthOfClosestParentInTaxonIds = ids.findIndex(id => id === closest.sourceId);

    if (depthOfParentInTaxonIds > depthOfClosestParentInTaxonIds) {
      return current;
    }
    return closest;
  }, possibleParents[0]);

  console.log(`closestParent: ${closestParent.id}`);
  return closestParent;
};

interface CreateIdentificationOptions {
  parentIdentificationId?: number;
  isAccessory?: boolean;
}

export const createIdentification = async (
  observationId: number,
  iNatId: number,
  name: string,
  sourceAncestorIds: number[],
  options: CreateIdentificationOptions
) => {
  const db = useDB();
  const user = useUser();
  const existingIdentification = await db.query.identifications.findFirst({
    where: and(
      eq(identifications.observationId, observationId),
      eq(identifications.sourceId, iNatId.toString()),
      activeIdentification()
    ),
    columns: {
      id: true
    }
  });

  if (existingIdentification) {
    throw new BadRequestError('This taxon has already been suggested for this observation');
  }

  const [identification] = await db
    .insert(identifications)
    .values({
      name,
      nickname: name,
      sourceId: iNatId.toString(),
      sourceAncestorIds,
      observationId,
      suggestedBy: user.id,
      alternateForId: options.parentIdentificationId,
      isAccessory: options.isAccessory
    })
    .returning();

  return identification;
};

export const addFeedbackToIdentification = async (
  identificationId: number,
  userId: number,
  type: FeedbackType,
  comment?: string
) => {
  const db = useDB();

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const identification = await tx.query.identifications.findFirst({
        where: and(eq(identifications.id, identificationId), activeIdentification())
      });
      if (!identification) throw new NotFoundError('Identification not found');
      if (identification.suggestedBy === userId)
        throw new BadRequestError('You cannot give feedback on your own suggestion');

      await tx
        .select({ id: observations.id })
        .from(observations)
        .where(eq(observations.id, identification.observationId))
        .for('update');

      const relatedIdentifications = await tx.query.identifications.findMany({
        where: and(
          eq(identifications.observationId, identification.observationId),
          activeIdentification(),
          identification.isAccessory
            ? eq(identifications.isAccessory, true)
            : sql`${identifications.isAccessory} is not true`
        ),
        columns: {
          id: true
        }
      });
      const relatedIdentificationIds = relatedIdentifications.map(({ id }) => id);
      const existingFeedbackInCategory = await tx.query.feedback.findMany({
        where: and(
          eq(feedback.userId, userId),
          eq(feedback.type, type),
          activeFeedback(),
          inArray(feedback.identificationId, relatedIdentificationIds)
        )
      });
      const existingFeedbackForTarget = existingFeedbackInCategory.filter(
        feedback => feedback.identificationId === identificationId
      );

      const pointsAwarded = existingFeedbackInCategory.length === 0 ? 10 + (comment ? 30 : 0) : 0;

      if (type === 'agree') {
        const feedbackToKeep = existingFeedbackForTarget[0] ?? existingFeedbackInCategory[0];
        if (feedbackToKeep) {
          const commentDeletedAt = comment
            ? null
            : feedbackToKeep.comment
              ? new Date()
              : feedbackToKeep.commentDeletedAt;
          await tx
            .update(feedback)
            .set({ identificationId, comment: comment ?? null, commentDeletedAt })
            .where(eq(feedback.id, feedbackToKeep.id));
          await moveFeedbackAchievements(feedbackToKeep, identificationId, { includeComment: !!comment });
          if (feedbackToKeep.comment && !comment) {
            await revokeCommentAchievements(feedbackToKeep);
          }

          await softDeleteFeedbackRows(
            existingFeedbackInCategory.filter(feedback => feedback.id !== feedbackToKeep.id)
          );
        } else {
          await tx.insert(feedback).values({
            identificationId,
            userId,
            type,
            comment
          });
        }

        const replacedDisagreement = await tx.query.feedback.findMany({
          where: and(
            eq(feedback.identificationId, identificationId),
            eq(feedback.userId, userId),
            eq(feedback.type, 'disagree'),
            activeFeedback()
          )
        });
        await softDeleteFeedbackRows(replacedDisagreement);
      } else {
        const feedbackToKeep = existingFeedbackForTarget[0];
        if (feedbackToKeep) {
          const commentDeletedAt = comment
            ? null
            : feedbackToKeep.comment
              ? new Date()
              : feedbackToKeep.commentDeletedAt;
          await tx
            .update(feedback)
            .set({ comment: comment ?? null, commentDeletedAt })
            .where(eq(feedback.id, feedbackToKeep.id));
          if (feedbackToKeep.comment && !comment) {
            await revokeCommentAchievements(feedbackToKeep);
          }

          await softDeleteFeedbackRows(existingFeedbackForTarget.slice(1));
        } else {
          await tx.insert(feedback).values({
            identificationId,
            userId,
            type,
            comment
          });
        }

        const replacedAgreement = await tx.query.feedback.findMany({
          where: and(
            eq(feedback.identificationId, identificationId),
            eq(feedback.userId, userId),
            eq(feedback.type, 'agree'),
            activeFeedback()
          )
        });
        await softDeleteFeedbackRows(replacedAgreement);
      }

      if (pointsAwarded > 0) {
        await recordAchievement('vote', userId, { payload: { identificationId } }, true);
        if (comment) {
          await recordAchievement('comment', userId, { payload: { identificationId } }, true);
        }
      }

      const savedFeedback = await tx.query.feedback.findFirst({
        where: and(
          eq(feedback.identificationId, identificationId),
          eq(feedback.userId, userId),
          eq(feedback.type, type),
          activeFeedback()
        ),
        columns: { id: true }
      });

      return { pointsAwarded, feedbackId: savedFeedback?.id };
    })
  );
};

export const addJustificationToIdentification = async (identificationId: number, userId: number, comment: string) => {
  const db = useDB();
  const trimmedComment = comment.trim();
  if (!trimmedComment) throw new BadRequestError('Comment is required');

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const identification = await tx.query.identifications.findFirst({
        where: and(eq(identifications.id, identificationId), activeIdentification())
      });

      if (!identification) throw new NotFoundError('Identification not found');
      if (identification.suggestedBy !== userId) {
        throw new ForbiddenError('You can only add a comment to your own suggestion.');
      }

      const existingJustification = await tx.query.feedback.findFirst({
        where: and(
          eq(feedback.identificationId, identificationId),
          eq(feedback.userId, userId),
          eq(feedback.type, 'justification'),
          activeFeedback()
        ),
        columns: {
          id: true
        }
      });

      if (existingJustification) {
        throw new BadRequestError('You have already added a comment to this suggestion');
      }

      const [entry] = await tx
        .insert(feedback)
        .values({
          identificationId,
          userId,
          type: 'justification',
          comment: trimmedComment
        })
        .returning({ id: feedback.id });

      return entry;
    })
  );
};

type FeedbackCommentModerator =
  | { source: 'census'; moderatorUserId: number }
  | { source: 'discord'; discordUserId: string };

const removeFeedbackCommentAfterAuthorization = async (feedbackId: number, moderator: FeedbackCommentModerator) => {
  const db = useDB();

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const [existingFeedback] = await tx
        .select()
        .from(feedback)
        .where(and(eq(feedback.id, feedbackId), activeFeedback()))
        .limit(1)
        .for('update');

      if (!existingFeedback) throw new NotFoundError('Feedback not found');
      if (existingFeedback.type !== 'agree' && existingFeedback.type !== 'disagree') {
        throw new BadRequestError('Only agree or disagree feedback comments can be removed with this action');
      }
      if (!existingFeedback.comment) return { removed: false as const };

      await revokeCommentAchievements(existingFeedback);
      await tx.update(feedback).set({ comment: null, commentDeletedAt: new Date() }).where(eq(feedback.id, feedbackId));
      await tx.insert(feedbackCommentModerations).values({
        feedbackId,
        source: moderator.source,
        moderatorUserId: moderator.source === 'census' ? moderator.moderatorUserId : null,
        discordUserId: moderator.source === 'discord' ? moderator.discordUserId : null
      });

      return { removed: true as const };
    })
  );
};

export const removeFeedbackComment = async (feedbackId: number) => {
  const user = useUser();
  const permissions = getPermissions();

  if (!permissions.moderate) {
    throw new ForbiddenError('You are not authorized to remove feedback comments.');
  }

  return await removeFeedbackCommentAfterAuthorization(feedbackId, {
    source: 'census',
    moderatorUserId: user.id
  });
};

export const removeFeedbackCommentFromDiscord = async (feedbackId: number, discordUserId: string) =>
  await removeFeedbackCommentAfterAuthorization(feedbackId, { source: 'discord', discordUserId });

export const removeFeedbackCommentFromDiscordMessage = async (discordMessageId: string, discordUserId: string) => {
  const db = useDB();
  const entry = await db.query.feedback.findFirst({
    where: eq(feedback.discordModerationMessageId, discordMessageId),
    columns: { id: true }
  });
  if (!entry) return { found: false as const };

  return {
    found: true as const,
    ...(await removeFeedbackCommentAfterAuthorization(entry.id, { source: 'discord', discordUserId }))
  };
};

const COMMENT_EDIT_WINDOW_MS = 60 * 60 * 1000;

export const editJustificationComment = async (feedbackId: number, userId: number, comment: string) => {
  const db = useDB();
  const trimmedComment = comment.trim();
  if (!trimmedComment) throw new BadRequestError('Comment is required');

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const existingFeedback = await tx.query.feedback.findFirst({
        where: and(eq(feedback.id, feedbackId), activeFeedback())
      });

      if (!existingFeedback) throw new NotFoundError('Feedback not found');
      if (existingFeedback.userId !== userId) {
        throw new ForbiddenError('You can only edit your own comment.');
      }
      if (!existingFeedback.comment || existingFeedback.commentDeletedAt) {
        throw new BadRequestError('Feedback does not have a comment to edit');
      }
      if (existingFeedback.type !== 'justification') {
        throw new BadRequestError('Only justification comments can be edited');
      }

      const isWithinEditWindow = Date.now() - existingFeedback.createdAt.getTime() < COMMENT_EDIT_WINDOW_MS;
      if (isWithinEditWindow) {
        await tx.update(feedback).set({ comment: trimmedComment }).where(eq(feedback.id, feedbackId));
      } else {
        await tx.insert(feedbackCommentEdits).values({ feedbackId, comment: trimmedComment });
      }

      return { mode: isWithinEditWindow ? ('replace' as const) : ('amend' as const) };
    })
  );
};

export const removeIdentification = async (identificationId: number) => {
  const db = useDB();
  const user = useUser();
  const permissions = getPermissions();

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const identification = await tx.query.identifications.findFirst({
        where: and(eq(identifications.id, identificationId), activeIdentification())
      });

      if (!identification) throw new NotFoundError('Identification not found');
      if (identification.suggestedBy !== user.id && !permissions.moderate) {
        throw new ForbiddenError('You are not authorized to remove this suggestion.');
      }

      await tx
        .update(identifications)
        .set({ alternateForId: identification.alternateForId })
        .where(eq(identifications.alternateForId, identification.id));

      await revokeAchievementsForIdentifications([identification.id]);
      await tx.update(shinies).set({ identificationId: null }).where(eq(shinies.identificationId, identification.id));
      await tx.update(observations).set({ confirmedAs: null }).where(eq(observations.confirmedAs, identification.id));
      const associatedFeedback = await tx.query.feedback.findMany({
        where: and(eq(feedback.identificationId, identification.id), activeFeedback())
      });
      await softDeleteFeedbackRows(associatedFeedback, { revokeAchievements: false });
      await tx
        .update(identifications)
        .set({ confirmedBy: null, shinyId: null, deletedAt: new Date() })
        .where(eq(identifications.id, identification.id));
    })
  );
};

export const getIdentification = async (identificationId: number) => {
  const db = useDB();
  const identification = await db.query.identifications.findFirst({
    where: and(eq(identifications.id, identificationId), activeIdentification()),
    with: {
      shiny: true,
      confirmer: true,
      suggester: true
    }
  });

  if (!identification) throw new NotFoundError('Identification not found');
  return {
    ...identification,
    observation: await getObservation(identification.observationId)
  };
};

export const getIdentificationsGroupedBySource = async () => {
  const db = useDB();

  const uniqueIdentificationsBySource = await db
    .select({
      sourceId: identifications.sourceId,
      name: identifications.name,
      count: sql<number>`count(*)`.mapWith(Number).as('count'),
      observationIds: sql<number[]>`array_agg(${identifications.observationId})`.as('observationIds')
    })
    .from(identifications)
    .where(and(isNotNull(identifications.confirmedBy), isNotNull(identifications.sourceId), activeIdentification()))
    .groupBy(identifications.sourceId, identifications.name);

  return uniqueIdentificationsBySource;
};
