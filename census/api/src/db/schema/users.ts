import { index, integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['capturer', 'member', 'expert', 'moderator', 'researcher', 'admin']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    twitchUserId: text('twitch_user_id').notNull(),
    username: text('username').notNull(),
    role: roleEnum('role').notNull(),
    points: integer('points').default(0).notNull()
  },
  table => {
    return {
      twitchUserIdIdx: index('twitch_user_id_idx').on(table.twitchUserId)
    };
  }
);
