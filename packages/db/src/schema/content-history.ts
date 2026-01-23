/**
 * Content history table schema.
 * Stores historical versions of content for auditing.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { content } from './content.js';

export const contentHistory = sqliteTable('content_history', {
  id: text('id').primaryKey(),
  contentId: text('content_id')
    .notNull()
    .references(() => content.id, { onDelete: 'cascade' }),
  value: text('value'), // JSON: Previous value
  changedBy: text('changed_by'), // User ID who made the change
  changedAt: integer('changed_at', { mode: 'timestamp' }).notNull(),
});

export type ContentHistory = typeof contentHistory.$inferSelect;
export type NewContentHistory = typeof contentHistory.$inferInsert;
