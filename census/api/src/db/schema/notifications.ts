import { boolean, index, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').notNull(),
    read: boolean('read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    payload: json('payload').notNull()
  },
  table => {
    return {
      userIdIdx: index('user_id_notifications_idx').on(table.userId)
    };
  }
);
