import { index, integer, json, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const metrics = pgTable(
  'metrics',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull(),
    value: json('value').notNull()
  },
  table => {
    return {
      uniqueNameCreatedAtIdx: uniqueIndex('unique_name_created_at_idx').on(table.name, table.createdAt),
      userIdIdx: index('user_id_metrics_idx').on(table.userId),
      nameIdx: index('name_metrics_idx').on(table.name)
    };
  }
);
