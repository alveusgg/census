import { relations } from 'drizzle-orm';
import { integer, json, numeric, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { identifications } from './identifications.js';
import { observations } from './observations.js';

export const BoundingBox = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

export type BoundingBox = z.infer<typeof BoundingBox>;

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  timestamp: numeric('timestamp').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  observationId: integer('observation_id').notNull(),
  identificationId: integer('identification_id'),
  boundingBox: json('bounding_box').$type<BoundingBox>().notNull()
});

export const imagesRelations = relations(images, ({ one }) => ({
  observation: one(observations, {
    fields: [images.observationId],
    references: [observations.id]
  }),
  identification: one(identifications, {
    fields: [images.identificationId],
    references: [identifications.id]
  })
}));
