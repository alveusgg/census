import { relations } from 'drizzle-orm';
import { boolean, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { identifications } from './identifications.js';
import { sightings } from './sightings.js';

export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  observedAt: timestamp('observed_at').notNull(),
  removed: boolean('removed').default(false).notNull(),
  confirmedAs: integer('confirmed_as'),
  moderated: json('moderated').$type<{ userId: string; type: string; message: string }[]>().default([]).notNull(),
  discordThreadId: text('discord_thread_id')
});

export const observationsRelations = relations(observations, ({ one, many }) => ({
  identifications: many(identifications),
  sightings: many(sightings),
  confirmedIdentification: one(identifications, {
    fields: [observations.confirmedAs],
    references: [identifications.id]
  })
}));
