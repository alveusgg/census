import { Actions, AnyAchievementPayload } from '@alveusgg/census-levels';
import { relations, sql } from 'drizzle-orm';
import { boolean, index, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { Sticker } from '../../services/points/achievement.js';
import { identifications } from './identifications.js';
import { observations } from './observations.js';
import { users } from './users.js';

export const achievements = pgTable(
  'achievements',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').$type<Actions>().notNull(),
    payload: json('payload').$type<AnyAchievementPayload>().notNull(),
    identificationId: integer('identification_id').references(() => identifications.id, { onDelete: 'set null' }),
    observationId: integer('observation_id').references(() => observations.id, { onDelete: 'set null' }),
    points: integer('points').notNull(),
    sticker: json('sticker').$type<Sticker>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    redeemed: boolean('redeemed').default(false).notNull(),
    revoked: boolean('revoked').default(false).notNull()
  },
  table => [
    index('user_id_achievements_idx').on(table.userId),
    index('type_achievements_idx').on(table.type),
    index('points_achievements_idx').on(table.points),
    index('achievements_valid_created_user_points_idx')
      .on(table.createdAt, table.userId)
      .where(sql`${table.redeemed} = true AND ${table.revoked} = false`),
    index('achievements_valid_user_created_points_idx')
      .on(table.userId, table.createdAt)
      .where(sql`${table.redeemed} = true AND ${table.revoked} = false`),
    index('achievements_pending_by_user_idx')
      .on(table.userId)
      .where(sql`${table.redeemed} = false AND ${table.revoked} = false`)
  ]
);

export type Achievement = typeof achievements.$inferSelect;

export const achievementsRelations = relations(achievements, ({ one }) => ({
  identification: one(identifications, {
    fields: [achievements.identificationId],
    references: [identifications.id]
  }),
  observation: one(observations, {
    fields: [achievements.observationId],
    references: [observations.id]
  }),
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id]
  })
}));
