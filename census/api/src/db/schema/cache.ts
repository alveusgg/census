import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const cache = pgTable(
  'cache',
  {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    expiredAt: timestamp('expired_at')
  },
  table => {
    return {
      expiredAtIdx: index('cache_expired_at_idx').on(table.expiredAt)
    };
  }
);
