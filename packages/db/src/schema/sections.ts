/**
 * Sections table schema.
 * Represents a section within a page (e.g., "hero", "features").
 */

import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';
import { pages } from './pages.js';

export const sections = sqliteTable(
  'sections',
  {
    id: text('id').primaryKey(),
    pageId: text('page_id')
      .notNull()
      .references(() => pages.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    isRepeater: integer('is_repeater', { mode: 'boolean' }).default(false),
    repeaterConfig: text('repeater_config'), // JSON: { min?, max?, itemLabel? }
    sortOrder: integer('sort_order').default(0),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => [unique().on(table.pageId, table.slug)]
);

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;
