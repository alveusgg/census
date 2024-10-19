import { relations } from 'drizzle-orm';
import { index, integer, json, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feedStatusEnum = pgEnum('status', ['offline', 'unhealthy', 'healthy']);

export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  status: feedStatusEnum('status').default('offline').notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  fallbackFeedId: text('fallback_feed_id')
});

export const feedsRelations = relations(feeds, ({ one }) => ({
  fallbackFeed: one(feeds, {
    fields: [feeds.fallbackFeedId],
    references: [feeds.id]
  })
}));

export const roleEnum = pgEnum('role', ['capturer', 'member', 'expert', 'moderator', 'researcher', 'admin']);

export const roles = pgTable('roles', {
  username: text('username').primaryKey(),
  role: roleEnum('role').notNull()
});

export const captureStatusEnum = pgEnum('capture_status', ['pending', 'processing', 'complete', 'archived']);

export const captures = pgTable('captures', {
  id: serial('id').primaryKey(),
  capturedAt: timestamp('captured_at').notNull(),
  capturedBy: text('captured_by').notNull(),

  status: captureStatusEnum('status').default('pending').notNull(),
  feedId: text('feed_id')
    .notNull()
    .references(() => feeds.id),
  startCaptureAt: timestamp('start_capture_at').notNull(),
  endCaptureAt: timestamp('end_capture_at').notNull(),

  videoUrl: text('video_url'),
  clipUrl: text('clip_url').unique('clip_url_unique_idx', { nulls: 'not distinct' })
});

export const capturesRelations = relations(captures, ({ one }) => ({
  feed: one(feeds, {
    fields: [captures.feedId],
    references: [feeds.id]
  }),
  capturer: one(roles, {
    fields: [captures.capturedBy],
    references: [roles.username]
  })
}));

export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  nickname: text('nickname').notNull(),
  captureId: integer('capture_id')
    .references(() => captures.id)
    .notNull(),
  discordThreadId: text('discord_thread_id').unique('discord_thread_id_unique_idx', { nulls: 'not distinct' })
});

export const observationsRelations = relations(observations, ({ one }) => ({
  capture: one(captures, {
    fields: [observations.captureId],
    references: [captures.id]
  })
}));

export const identifications = pgTable(
  'identifications',
  {
    id: serial('id').primaryKey(),
    nickname: text('nickname').notNull(),
    name: text('name').notNull(),
    sourceId: text('source_id').notNull(),

    observationId: integer('observation_id')
      .references(() => observations.id)
      .notNull(),
    suggestedBy: text('suggested_by')
      .notNull()
      .references(() => roles.username),
    confirmedBy: text('confirmed_by').references(() => roles.username),
    alternateFor: integer('alternate_for'),

    upvotes: json('upvotes').$type<string[]>().default([]).notNull(),
    downvotes: json('downvotes').$type<string[]>().default([]).notNull()
  },
  table => {
    return {
      sourceIdx: index('source_idx').on(table.sourceId)
    };
  }
);

export const tagTypeEnum = pgEnum('tag_type', ['generic', 'event', 'campaign']);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: tagTypeEnum('type').notNull()
});

export const tagAssignments = pgTable('tag_assignments', {
  tagId: integer('tag_id')
    .references(() => tags.id)
    .notNull(),
  identificationId: integer('identification_id')
    .references(() => identifications.id)
    .notNull()
});

export const tagAssignmentsRelations = relations(tagAssignments, ({ one }) => ({
  tag: one(tags, {
    fields: [tagAssignments.tagId],
    references: [tags.id]
  }),
  identification: one(identifications, {
    fields: [tagAssignments.identificationId],
    references: [identifications.id]
  })
}));

export const identificationsRelations = relations(identifications, ({ one, many }) => ({
  observation: one(observations, {
    fields: [identifications.observationId],
    references: [observations.id]
  }),
  confirmer: one(roles, {
    fields: [identifications.confirmedBy],
    references: [roles.username]
  }),
  suggester: one(roles, {
    fields: [identifications.suggestedBy],
    references: [roles.username]
  }),
  alternateFor: one(identifications, {
    fields: [identifications.alternateFor],
    references: [identifications.id]
  }),
  tags: many(tagAssignments)
}));

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  frame: integer('frame').notNull(),
  observationId: integer('observation_id').notNull(),
  identificationId: integer('identification_id'),
  boundingBoxes: json('bounding_boxes').$type<BoundingBox[]>().default([]).notNull()
});

export const imagesRelations = relations(images, ({ one }) => ({
  observation: one(observations, {
    fields: [images.observationId],
    references: [observations.id]
  }),
  identification: one(identifications, {
    fields: [images.identificationId],
    references: [identifications.id]
  })
}));
