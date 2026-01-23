/**
 * Pages table schema.
 * Represents a page in the CMS (e.g., "home", "about").
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const pages = sqliteTable('pages', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  sourceFiles: text('source_files'), // JSON array of source file paths
  fieldCount: integer('field_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
