import { boolean, index, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['capturer', 'member', 'expert', 'moderator', 'researcher', 'admin', 'pending']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    twitchUserId: text('twitch_user_id').notNull(),
    username: text('username').notNull(),
    role: roleEnum('role').notNull(),
    restricted: boolean('restricted').default(false).notNull(),
    banned: boolean('banned').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  table => {
    return {
      twitchUserIdIdx: index('twitch_user_id_idx').on(table.twitchUserId)
    };
  }
);
