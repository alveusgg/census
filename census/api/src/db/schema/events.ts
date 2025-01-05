import { index, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const events = pgTable(
  'events',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    payload: json('payload').notNull()
  },
  table => {
    return {
      userIdIdx: index('user_id_events_idx').on(table.userId),
      typeIdx: index('type_events_idx').on(table.type)
    };
  }
);
