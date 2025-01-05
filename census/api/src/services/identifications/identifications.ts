import { and, eq, inArray } from 'drizzle-orm';
import { feedback, identifications } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { useUser } from '../../utils/env/env.js';
import { getTaxaInfo } from '../inat/index.js';

export const suggestIdentification = async (observationId: number, iNatId: number) => {
  const source = await getTaxaInfo(iNatId);
  const parent = await getPossibleParentIdentifications(observationId, source.ancestor_ids);
  return createIdentification(
    observationId,
    iNatId,
    source.preferred_common_name ?? source.name,
    source.ancestor_ids,
    parent?.id
  );
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

export const createIdentification = async (
  observationId: number,
  iNatId: number,
  name: string,
  sourceAncestorIds: number[],
  parentIdentificationId?: number
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
      alternateForId: parentIdentificationId
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
