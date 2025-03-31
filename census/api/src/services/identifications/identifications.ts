import { BadRequestError, NotFoundError } from '@alveusgg/error';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { feedback, identifications, observations } from '../../db/schema/index.js';
import { useDB, withTransaction } from '../../db/transaction.js';
import { useUser } from '../../utils/env/env.js';
import { getTaxaInfo } from '../inat/index.js';
import { recordAchievement } from '../points/achievement.js';

export const suggestIdentification = async (observationId: number, iNatId: number) => {
  const source = await getTaxaInfo(iNatId);
  const parent = await getPossibleParentIdentifications(observationId, source.ancestor_ids);
  return createIdentification(observationId, iNatId, source.preferred_common_name ?? source.name, source.ancestor_ids, {
    parentIdentificationId: parent?.id
  });
};

export const suggestAccessoryIdentification = async (observationId: number, iNatId: number) => {
  const source = await getTaxaInfo(iNatId);
  return createIdentification(observationId, iNatId, source.preferred_common_name ?? source.name, source.ancestor_ids, {
    isAccessory: true
  });
};

export const confirmIdentification = async (identificationId: number, comment: string) => {
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
        comment: comment
      });
      await tx
        .update(observations)
        .set({ confirmedAs: identification.id })
        .where(eq(observations.id, identification.observationId));

      await recordAchievement('identify', identification.suggestedBy, { identificationId });
      user.achievements();
    });
  });
};

export const getPossibleParentIdentifications = async (observationId: number, taxonIds: number[]) => {
  const db = useDB();
  const ids = taxonIds.map(id => id.toString());
  const possibleParents = await db
    .select()
    .from(identifications)
    .where(and(eq(identifications.observationId, observationId), inArray(identifications.sourceId, ids)));

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
  return await db.insert(feedback).values({
    identificationId,
    userId,
    type,
    comment
  });
};

export const getIdentification = async (identificationId: number) => {
  const db = useDB();
  const identification = await db.query.identifications.findFirst({
    where: eq(identifications.id, identificationId),
    with: {
      shiny: true,
      confirmer: true,
      suggester: true,
      observation: {
        with: {
          images: true,
          observer: true
        }
      }
    }
  });

  if (!identification) throw new NotFoundError('Identification not found');
  return identification;
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
