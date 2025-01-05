import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core';
import { identifications } from './identifications.js';

export const tagTypeEnum = pgEnum('tag_type', ['generic', 'event', 'campaign']);

export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: tagTypeEnum('type').notNull()
});

export const tagAssignments = pgTable('tag_assignments', {
  tagId: integer('tag_id')
    .references(() => tags.id)
    .notNull(),
  identificationId: integer('identification_id')
    .references(() => identifications.id)
    .notNull()
});

export const tagAssignmentsRelations = relations(tagAssignments, ({ one }) => ({
  tag: one(tags, {
    fields: [tagAssignments.tagId],
    references: [tags.id]
  }),
  identification: one(identifications, {
    fields: [tagAssignments.identificationId],
    references: [identifications.id]
  })
}));
