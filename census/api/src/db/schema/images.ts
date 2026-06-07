import { relations } from 'drizzle-orm';
import { index, integer, json, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { identifications } from './identifications.js';
import { sightings } from './sightings.js';

export const BoundingBox = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

export type BoundingBox = z.infer<typeof BoundingBox>;

export const images = pgTable(
  'images',
  {
    id: serial('id').primaryKey(),
    url: text('url').notNull(),
    timestamp: numeric('timestamp').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    sightingId: integer('sighting_id')
      .references(() => sightings.id, { onDelete: 'cascade' })
      .notNull(),
    identificationId: integer('identification_id'),
    boundingBox: json('bounding_box').$type<BoundingBox>().notNull()
  },
  table => ({
    sightingIdIdx: index('images_sighting_id_idx').on(table.sightingId).concurrently(),
    identificationIdIdx: index('images_identification_id_idx').on(table.identificationId).concurrently()
  })
);

export const imagesRelations = relations(images, ({ one }) => ({
  sighting: one(sightings, {
    fields: [images.sightingId],
    references: [sightings.id]
  }),
  identification: one(identifications, {
    fields: [images.identificationId],
    references: [identifications.id]
  })
}));
