import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
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
    type: text('type').notNull(),
    identificationId: integer('identification_id').references(() => identifications.id),
    observationId: integer('observation_id').references(() => observations.id),
    points: integer('points').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    redeemed: boolean('redeemed').default(false).notNull(),
    revoked: boolean('revoked').default(false).notNull()
  },
  table => {
    return {
      userIdIdx: index('user_id_achievements_idx').on(table.userId),
      typeIdx: index('type_achievements_idx').on(table.type),
      pointsIdx: index('points_achievements_idx').on(table.points)
    };
  }
);

export const achievementsRelations = relations(achievements, ({ one }) => ({
  identification: one(identifications, {
    fields: [achievements.identificationId],
    references: [identifications.id]
  }),
  observation: one(observations, {
    fields: [achievements.observationId],
    references: [observations.id]
  })
}));
