import { pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const feedStatusEnum = pgEnum('status', ['offline', 'unhealthy', 'healthy']);
export const clientPermsEnum = pgEnum('perms', ['request', 'provide']);

export const feeds = pgTable('feeds', {
  id: text('id').primaryKey(),
  key: text('key').notNull(),
  status: feedStatusEnum('status').default('offline').notNull(),
  lastSeenAt: timestamp('last_seen_at')
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  key: text('key').notNull(),
  perms: clientPermsEnum('perms').array().default([])
});

export const requests = pgTable('requests', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),

  start: timestamp('start').notNull(),
  end: timestamp('end').notNull(),

  feedId: text('feed_id').references(() => feeds.id)
});
