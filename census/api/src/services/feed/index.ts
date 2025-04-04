import { eq, inArray } from 'drizzle-orm';

import { NotAuthenticatedError, NotFoundError } from '@alveusgg/error';
import { feeds } from '../../db/schema/index.js';
import { useDB } from '../../db/transaction.js';

export const ensureKeyForFeeds = async (feedIds: string[], key: string) => {
  const db = useDB();
  const targets = await db.query.feeds.findMany({
    where: inArray(feeds.id, feedIds),
    columns: {
      id: true,
      key: true
    }
  });

  if (targets.length === 0) {
    throw new NotAuthenticatedError('None of the feeds that you are trying to access exist.');
  }

  const unAuthenticatedFeeds = targets.filter(target => target.key !== key);
  if (unAuthenticatedFeeds.length > 0) {
    throw new NotAuthenticatedError(`Invalid key for ${unAuthenticatedFeeds.map(feed => feed.id).join(', ')}`);
  }

  return targets.map(target => target.id);
};

export const getFeed = async (feedId: string) => {
  const db = useDB();
  const feed = await db.query.feeds.findFirst({
    where: eq(feeds.id, feedId)
  });
  if (!feed) {
    throw new NotFoundError(`Feed ${feedId} not found`);
  }
  return feed;
};
