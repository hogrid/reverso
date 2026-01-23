/**
 * Content table schema.
 * Stores the actual values for each field, with locale support.
 */

import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { fields } from './fields.js';

export const content = sqliteTable(
  'content',
  {
    id: text('id').primaryKey(),
    fieldId: text('field_id')
      .notNull()
      .references(() => fields.id, { onDelete: 'cascade' }),
    locale: text('locale').default('default').notNull(),
    value: text('value'), // JSON: Supports all field types
    published: integer('published', { mode: 'boolean' }).default(false),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [unique().on(table.fieldId, table.locale)]
);

export type Content = typeof content.$inferSelect;
export type NewContent = typeof content.$inferInsert;
