import { relations } from 'drizzle-orm';
import { date, integer, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { identifications } from './identifications.js';

export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull()
});

export const shinies = pgTable('shinies', {
  id: serial('id').primaryKey(),
  seasonId: integer('season_id').references(() => seasons.id),
  assetId: text('asset_id').notNull(),
  inatId: integer('inat_id').notNull(),
  key: text('key').notNull(),
  identificationId: integer('identification_id')
});

export const shiniesRelations = relations(shinies, ({ one }) => ({
  season: one(seasons, {
    fields: [shinies.seasonId],
    references: [seasons.id]
  }),
  identification: one(identifications, {
    fields: [shinies.identificationId],
    references: [identifications.id]
  })
}));
