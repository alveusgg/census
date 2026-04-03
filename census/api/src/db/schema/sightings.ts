import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { captures } from './captures.js';
import { images } from './images.js';
import { observations } from './observations.js';
import { users } from './users.js';

export const sightings = pgTable('sightings', {
  id: serial('id').primaryKey(),
  nickname: text('nickname'),
  observationId: integer('observation_id')
    .references(() => observations.id)
    .notNull(),
  captureId: integer('capture_id')
    .references(() => captures.id)
    .notNull(),
  observedAt: timestamp('observed_at').notNull(),
  observedBy: integer('observed_by')
    .notNull()
    .references(() => users.id)
});

export type Sighting = typeof sightings.$inferSelect;

export const sightingsRelations = relations(sightings, ({ one, many }) => ({
  observation: one(observations, {
    fields: [sightings.observationId],
    references: [observations.id]
  }),
  capture: one(captures, {
    fields: [sightings.captureId],
    references: [captures.id]
  }),
  observer: one(users, {
    fields: [sightings.observedBy],
    references: [users.id]
  }),
  images: many(images)
}));
