import { BadRequestError, ForbiddenError, NotFoundError } from '@alveusgg/error';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { achievements, feedback, identifications, observations, type ConfirmationAnnotation } from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { useUser } from '../../utils/env/env.js';
import { getPermissions } from '../auth/role.js';
import { getTaxaInfo } from '../inat/index.js';
import { getObservation } from '../observations/observations.js';
import { recordAchievement } from '../points/achievement.js';

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
        where: eq(identifications.id, identificationId)
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
      user.achievements();
    });
  });
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
    where: and(eq(identifications.observationId, observationId), eq(identifications.sourceId, iNatId.toString())),
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
  type: 'agree' | 'disagree',
  comment?: string
) => {
  const db = useDB();
  const identification = await db.query.identifications.findFirst({
    where: eq(identifications.id, identificationId)
  });
  if (!identification) throw new NotFoundError('Identification not found');
  if (identification.suggestedBy === userId)
    throw new BadRequestError('You cannot give feedback on your own suggestion');

  return await db.insert(feedback).values({
    identificationId,
    userId,
    type,
    comment
  });
};

export const removeFeedbackComment = async (feedbackId: number) => {
  const db = useDB();
  const permissions = getPermissions();

  if (!permissions.moderate) {
    throw new ForbiddenError('You are not authorized to remove feedback comments.');
  }

  return await db.transaction(async tx =>
    withTransaction(tx, async () => {
      const existingFeedback = await tx.query.feedback.findFirst({
        where: eq(feedback.id, feedbackId)
      });

      if (!existingFeedback) throw new NotFoundError('Feedback not found');
      if (existingFeedback.type === 'confirm') {
        throw new BadRequestError('Confirmation feedback comments cannot be removed with this action');
      }
      if (!existingFeedback.comment) throw new BadRequestError('Feedback does not have a comment to remove');

      await tx.update(feedback).set({ comment: null }).where(eq(feedback.id, feedbackId));

      const [commentAchievement] = await tx
        .select({ id: achievements.id })
        .from(achievements)
        .where(
          and(
            eq(achievements.type, 'comment'),
            eq(achievements.userId, existingFeedback.userId),
            eq(achievements.identificationId, existingFeedback.identificationId),
            eq(achievements.revoked, false)
          )
        )
        .orderBy(desc(achievements.createdAt))
        .limit(1);

      if (commentAchievement) {
        await tx.update(achievements).set({ revoked: true }).where(eq(achievements.id, commentAchievement.id));
      }
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
        where: eq(identifications.id, identificationId)
      });

      if (!identification) throw new NotFoundError('Identification not found');
      if (identification.suggestedBy !== user.id && !permissions.moderate) {
        throw new ForbiddenError('You are not authorized to remove this suggestion.');
      }

      await tx
        .update(identifications)
        .set({ alternateForId: identification.alternateForId })
        .where(eq(identifications.alternateForId, identification.id));

      await tx.update(observations).set({ confirmedAs: null }).where(eq(observations.confirmedAs, identification.id));
      await tx.delete(identifications).where(eq(identifications.id, identification.id));
    })
  );
};

export const getIdentification = async (identificationId: number) => {
  const db = useDB();
  const identification = await db.query.identifications.findFirst({
    where: eq(identifications.id, identificationId),
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
    .where(and(isNotNull(identifications.confirmedBy), isNotNull(identifications.sourceId)))
    .groupBy(identifications.sourceId, identifications.name);

  return uniqueIdentificationsBySource;
};
