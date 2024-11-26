import { identifications } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';
import { useUser } from '../../utils/env/env.js';
import { getTaxaInfo } from '../inat/index.js';

export const suggestIdentification = async (observationId: number, iNatId: number) => {
  const source = await getTaxaInfo(iNatId);
  return createIdentification(observationId, iNatId, source.preferred_common_name ?? source.name);
};

export const createIdentification = async (observationId: number, iNatId: number, name: string) => {
  const db = useDB();
  const user = useUser();

  const [identification] = await db
    .insert(identifications)
    .values({
      name,
      nickname: name,
      sourceId: iNatId.toString(),
      observationId,
      suggestedBy: user.twitchUserId
    })
    .returning();

  return identification;
};
