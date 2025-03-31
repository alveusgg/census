import { BadRequestError } from '@alveusgg/error';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { seasons, shinies } from '../../db/schema/seasons.js';
import { useDB } from '../../db/transaction.js';

export const getCurrentSeason = async () => {
  const db = useDB();

  const season = await db.query.seasons.findFirst({
    where: and(lte(seasons.startDate, sql`now()`), gte(seasons.endDate, sql`now()`))
  });

  if (!season) throw new BadRequestError('No current season. Please setup a new season.');
  return season;
};

export const getSeasons = async () => {
  const db = useDB();
  return db.query.seasons.findMany();
};

export const getRawShiniesForSeason = async (seasonId: number) => {
  const db = useDB();
  return db.query.shinies.findMany({
    where: eq(shinies.seasonId, seasonId)
  });
};

export const getShiniesForSeason = async (seasonId: number) => {
  const db = useDB();
  const results = await db.query.shinies.findMany({
    where: eq(shinies.seasonId, seasonId)
  });

  const obfuscated = results.map(shiny => {
    if (shiny.identificationId) return shiny;
    return {
      id: shiny.id,
      assetId: shiny.assetId,
      seasonId: shiny.seasonId
    };
  });

  return obfuscated.sort((a, b) => {
    // If has "key", put first
    if ('key' in a) return -1;
    if ('key' in b) return 1;
    return 0;
  });
};
