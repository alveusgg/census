import { relations } from 'drizzle-orm';
import { boolean, integer, json, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { captures } from './captures.js';
import { identifications } from './identifications.js';
import { images } from './images.js';
import { users } from './users.js';

export const observations = pgTable('observations', {
  id: serial('id').primaryKey(),
  nickname: text('nickname'),
  captureId: integer('capture_id')
    .references(() => captures.id)
    .notNull(),
  observedAt: timestamp('observed_at').notNull(),
  observedBy: integer('observed_by')
    .notNull()
    .references(() => users.id),
  removed: boolean('removed').default(false).notNull(),
  confirmedAs: integer('confirmed_as'),
  moderated: json('moderated').$type<{ userId: string; type: string; message: string }[]>().default([]).notNull(),
  discordThreadId: text('discord_thread_id')
});

export const observationsRelations = relations(observations, ({ one, many }) => ({
  capture: one(captures, {
    fields: [observations.captureId],
    references: [captures.id]
  }),
  identifications: many(identifications),
  images: many(images),
  observer: one(users, {
    fields: [observations.observedBy],
    references: [users.id]
  }),
  confirmedIdentification: one(identifications, {
    fields: [observations.confirmedAs],
    references: [identifications.id]
  })
}));
