import { relations, sql } from 'drizzle-orm';
import { index, integer, json, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { feeds } from './feeds.js';
import { sightings } from './sightings.js';
import { users } from './users.js';

export const captureStatusEnum = pgEnum('capture_status', [
  'draft',
  'pending',
  'processing',
  'complete',
  'archived',
  'failed',
  'dead',
  // Explicitly cleared by the user, as opposed to 'dead' which means the
  // retry queue exhausted its attempts.
  'user_killed'
]);

export const captures = pgTable(
  'captures',
  {
    id: serial('id').primaryKey(),
    capturedAt: timestamp('captured_at').notNull(),
    capturedBy: integer('captured_by')
      .notNull()
      .references(() => users.id),
    status: captureStatusEnum('status').default('pending').notNull(),
    feedId: text('feed_id')
      .notNull()
      .references(() => feeds.id),
    startCaptureAt: timestamp('start_capture_at').notNull(),
    endCaptureAt: timestamp('end_capture_at').notNull(),
    videoUrl: text('video_url'),
    lowQualityVideoUrl: text('low_quality_video_url'),
    muxAssetId: text('mux_asset_id'),
    muxPlaybackId: text('mux_playback_id'),
    upgradeAttemptCount: integer('upgrade_attempt_count').default(1).notNull(),
    retryUpgradeFrom: timestamp('retry_upgrade_from'),
    clipId: text('clip_id').unique().notNull(),
    clipMetadata: json('clip_metadata').$type<{ views: number; thumbnail: string }>().notNull()
  },
  table => ({
    clipIdIdx: index('clip_id_idx').on(table.clipId),
    capturedAtDescIdx: index('captures_captured_at_desc_idx').on(table.capturedAt.desc()),
    capturedByCapturedAtNotDeadIdx: index('captures_captured_by_captured_at_not_dead_idx')
      .on(table.capturedBy, table.capturedAt.desc())
      .where(sql`${table.status} != 'dead'`),
    pendingFeedIdx: index('captures_pending_feed_idx')
      .on(table.feedId)
      .where(sql`${table.status} = 'pending'`)
  })
);

export type Capture = typeof captures.$inferSelect;

export const capturesRelations = relations(captures, ({ one, many }) => ({
  feed: one(feeds, {
    fields: [captures.feedId],
    references: [feeds.id]
  }),
  capturer: one(users, {
    fields: [captures.capturedBy],
    references: [users.id]
  }),
  sightings: many(sightings)
}));
