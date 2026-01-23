/**
 * Fields table schema.
 * Stores the schema for each field detected by the scanner.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sections } from './sections.js';

export const fields = sqliteTable('fields', {
  id: text('id').primaryKey(),
  sectionId: text('section_id')
    .notNull()
    .references(() => sections.id, { onDelete: 'cascade' }),
  path: text('path').notNull().unique(), // Full path: home.hero.title
  type: text('type').notNull(), // text, image, etc.
  label: text('label'),
  placeholder: text('placeholder'),
  required: integer('required', { mode: 'boolean' }).default(false),
  validation: text('validation'), // JSON: Zod schema string
  options: text('options'), // JSON: Array of options for select fields
  condition: text('condition'), // Conditional display logic
  config: text('config'), // JSON: Field-specific config (min, max, accept, etc.)
  defaultValue: text('default_value'), // Default content from JSX
  help: text('help'), // Help text
  sourceFile: text('source_file'),
  sourceLine: integer('source_line'),
  sourceColumn: integer('source_column'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
