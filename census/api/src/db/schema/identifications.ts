import { relations } from 'drizzle-orm';
import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { observations } from './observations.js';
import { tagAssignments } from './tags.js';
import { users } from './users.js';

export interface Feedback {
  type: 'agree' | 'disagree';
  userId: number;
  comment?: string;
}

export const identifications = pgTable(
  'identifications',
  {
    id: serial('id').primaryKey(),
    nickname: text('nickname').notNull(),
    name: text('name').notNull(),
    sourceId: text('source_id').notNull(),
    sourceAncestorIds: integer('source_ancestor_ids').array().notNull(),
    observationId: integer('observation_id')
      .references(() => observations.id)
      .notNull(),
    suggestedBy: integer('suggested_by')
      .notNull()
      .references(() => users.id),
    confirmedBy: integer('confirmed_by').references(() => users.id),
    alternateForId: integer('alternate_for'),
    isAccessory: boolean('is_accessory').default(false)
  },
  table => {
    return {
      sourceIdx: index('source_idx').on(table.sourceId)
    };
  }
);

export const feedbackTypes = pgEnum('feedback_type', ['agree', 'disagree', 'confirm']);

export const feedback = pgTable(
  'feedback',
  {
    id: serial('id').primaryKey(),
    identificationId: integer('identification_id')
      .references(() => identifications.id)
      .notNull(),
    type: feedbackTypes('type').notNull(),
    userId: integer('user_id')
      .references(() => users.id)
      .notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  table => {
    return {
      identificationIdx: index('identification_idx').on(table.identificationId),
      userIdIdx: index('user_idx').on(table.userId)
    };
  }
);

export const feedbackRelations = relations(feedback, ({ one }) => ({
  identification: one(identifications, {
    fields: [feedback.identificationId],
    references: [identifications.id]
  })
}));

export const identificationsRelations = relations(identifications, ({ one, many }) => ({
  observation: one(observations, {
    fields: [identifications.observationId],
    references: [observations.id]
  }),
  confirmer: one(users, {
    fields: [identifications.confirmedBy],
    references: [users.id]
  }),
  suggester: one(users, {
    fields: [identifications.suggestedBy],
    references: [users.id]
  }),
  alternateFor: one(identifications, {
    fields: [identifications.alternateForId],
    references: [identifications.id]
  }),
  tags: many(tagAssignments),
  feedback: many(feedback)
}));
