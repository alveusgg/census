import { relations } from 'drizzle-orm';
import { index, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const responses = pgTable(
  'responses',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    type: text('type').notNull(),
    payload: json('payload').notNull()
  },
  table => {
    return {
      userIdIdx: index('user_id_responses_idx').on(table.userId)
    };
  }
);

export const responsesRelations = relations(responses, ({ one }) => ({
  user: one(users, {
    fields: [responses.userId],
    references: [users.id]
  })
}));
