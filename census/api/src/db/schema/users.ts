import { index, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['active', 'pending']);

export type Status = (typeof userStatusEnum.enumValues)[number];
export type Role = 'census_admin' | 'census_moderator' | 'ptzControl';

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    status: userStatusEnum('status').notNull(),
    providerId: text('provider_id').notNull(),
    username: text('username').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  table => {
    return {
      providerIdIdx: index('provider_id_idx').on(table.providerId)
    };
  }
);

export type User = typeof users.$inferSelect;
