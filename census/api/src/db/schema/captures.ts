import { relations } from 'drizzle-orm';
import { index, integer, json, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { feeds } from './feeds.js';
import { observations } from './observations.js';
import { users } from './users.js';

export const captureStatusEnum = pgEnum('capture_status', ['draft', 'pending', 'processing', 'complete', 'archived']);

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
    muxAssetId: text('mux_asset_id'),
    muxPlaybackId: text('mux_playback_id'),
    clipId: text('clip_id').unique().notNull(),
    clipMetadata: json('clip_metadata').$type<{ views: number; thumbnail: string }>().notNull()
  },
  table => ({
    clipIdIdx: index('clip_id_idx').on(table.clipId)
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
  observations: many(observations)
}));
