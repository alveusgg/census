import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const feedStatusEnum = pgEnum('status', ['offline', 'unhealthy', 'healthy']);

export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  status: feedStatusEnum('status').default('offline').notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  fallbackFeedId: text('fallback_feed_id'),
  latencyFromCamToRecorderInSeconds: integer('latency_from_cam_to_recorder_in_seconds').default(0)
});

export const feedsRelations = relations(feeds, ({ one }) => ({
  fallbackFeed: one(feeds, {
    fields: [feeds.fallbackFeedId],
    references: [feeds.id]
  })
}));
