import { relations } from 'drizzle-orm';
import { boolean, index, integer, json, numeric, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

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

export const users = pgTable('users', {
  username: text('username').primaryKey(),
  role: roleEnum('role').notNull(),

  points: integer('points').default(0).notNull()
});

export const captureStatusEnum = pgEnum('capture_status', ['draft', 'pending', 'processing', 'complete', 'archived']);

export const captures = pgTable(
  'captures',
  {
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
    references: [users.username]
  }),
  observations: many(observations)
}));

export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  nickname: text('nickname'),
  captureId: integer('capture_id')
    .references(() => captures.id)
    .notNull(),
  observedAt: timestamp('observed_at').notNull(),
  observedBy: text('observed_by')
    .notNull()
    .references(() => users.username),

  removed: boolean('removed').default(false).notNull(),
  moderated: json('moderated').$type<{ username: string; type: string; message: string }[]>().default([]).notNull(),
  discordThreadId: text('discord_thread_id')
});

export const observationsRelations = relations(observations, ({ one, many }) => ({
  capture: one(captures, {
    fields: [observations.captureId],
    references: [captures.id]
  }),
  identifications: many(identifications),
  images: many(images)
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
      .references(() => users.username),
    confirmedBy: text('confirmed_by').references(() => users.username),
    alternateForId: integer('alternate_for'),
    accessoryForId: integer('accessory_for'),

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
  confirmer: one(users, {
    fields: [identifications.confirmedBy],
    references: [users.username]
  }),
  suggester: one(users, {
    fields: [identifications.suggestedBy],
    references: [users.username]
  }),
  alternateFor: one(identifications, {
    fields: [identifications.alternateForId],
    references: [identifications.id]
  }),
  accessoryFor: one(identifications, {
    fields: [identifications.accessoryForId],
    references: [identifications.id]
  }),
  accessoryIdentifications: many(identifications),
  tags: many(tagAssignments)
}));

export const BoundingBox = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

export type BoundingBox = z.infer<typeof BoundingBox>;

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  timestamp: numeric('timestamp').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  observationId: integer('observation_id').notNull(),
  identificationId: integer('identification_id'),
  boundingBox: json('bounding_box').$type<BoundingBox>().notNull()
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

export const achievements = pgTable(
  'achievements',
  {
    id: serial('id').primaryKey(),
    username: text('username')
      .notNull()
      .references(() => users.username),
    type: text('type').notNull(),
    identificationId: integer('identification_id').references(() => identifications.id),
    observationId: integer('observation_id').references(() => observations.id),

    points: integer('points').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    redeemed: boolean('redeemed').default(false).notNull(),
    revoked: boolean('revoked').default(false).notNull()
  },
  table => {
    return {
      usernameIdx: index('username_achievements_idx').on(table.username),
      typeIdx: index('type_achievements_idx').on(table.type),
      pointsIdx: index('points_achievements_idx').on(table.points)
    };
  }
);

export const achievementsRelations = relations(achievements, ({ one }) => ({
  identification: one(identifications, {
    fields: [achievements.identificationId],
    references: [identifications.id]
  }),
  observation: one(observations, {
    fields: [achievements.observationId],
    references: [observations.id]
  })
}));

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    username: text('username')
      .notNull()
      .references(() => users.username),
    type: text('type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    payload: json('payload').notNull()
  },
  table => {
    return {
      usernameIdx: index('username_events_idx').on(table.username),
      typeIdx: index('type_events_idx').on(table.type)
    };
  }
);

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    username: text('username')
      .notNull()
      .references(() => users.username),
    type: text('type').notNull(),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),

    payload: json('payload').notNull()
  },
  table => {
    return {
      usernameIdx: index('username_notifications_idx').on(table.username)
    };
  }
);
