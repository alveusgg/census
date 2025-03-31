import { RoomSnapshot } from '@tldraw/sync-core';
import { relations } from 'drizzle-orm';
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const guides = pgTable('guides', {
  id: uuid('id').primaryKey(),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  publishedDocumentId: uuid('published_document_id'),
  draftDocumentId: uuid('draft_document_id').notNull()
});

export const guideRelations = relations(guides, ({ one }) => ({
  published: one(documents, {
    fields: [guides.publishedDocumentId],
    references: [documents.id]
  }),
  draft: one(documents, {
    fields: [guides.draftDocumentId],
    references: [documents.id]
  })
}));

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey(),
  guideId: uuid('guide_id'),
  content: jsonb('content').$type<RoomSnapshot>(),
  contributorIds: integer('contributors_id').array().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const documentRelations = relations(documents, ({ one, many }) => ({
  guide: one(guides, {
    fields: [documents.guideId],
    references: [guides.id]
  }),
  contributors: many(users)
}));
