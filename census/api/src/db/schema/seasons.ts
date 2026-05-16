import { relations } from 'drizzle-orm';
import { integer, json, pgTable, serial, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { identifications } from './identifications.js';
import { ImageLocation } from '../../services/points/achievement.js';

export const seasons = pgTable('seasons', {
  id: serial('id').primaryKey(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull()
});

export const shinies = pgTable(
  'shinies',
  {
    id: serial('id').primaryKey(),
    seasonId: integer('season_id').references(() => seasons.id),
    artwork: json('artwork').$type<ImageLocation>().notNull(),
    silhouette: json('silhouette').$type<ImageLocation>().notNull(),
    inatId: integer('inat_id').notNull(),
    identificationId: integer('identification_id')
  },
  table => ({
    identificationIdIdx: uniqueIndex('identification_id_idx').on(table.identificationId),
    iNatIdIdx: uniqueIndex('i_nat_id_idx').on(table.inatId)
  })
);

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
