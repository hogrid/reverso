/**
 * Form fields table schema.
 * Stores individual form field configurations.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { forms } from './forms.js';

export const formFields = sqliteTable('form_fields', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),

  // Field identity
  name: text('name').notNull(), // Field name (used in submission data)
  type: text('type').notNull(), // text, email, textarea, number, select, checkbox, radio, date, file, hidden

  // Display
  label: text('label'),
  placeholder: text('placeholder'),
  help: text('help'),

  // Validation
  required: integer('required', { mode: 'boolean' }).default(false),
  validation: text('validation'), // JSON: Zod schema string or validation rules

  // Configuration
  config: text('config'), // JSON: Field-specific config (options for select, accept for file, etc.)
  width: integer('width').default(12), // Grid width 1-12
  step: integer('step').default(1), // Step number for multi-step forms

  // Ordering
  sortOrder: integer('sort_order').default(0),

  // Conditional logic
  condition: text('condition'), // JSON: { field, operator, value }

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type NewFormField = typeof formFields.$inferInsert;

/**
 * Form field type.
 */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file'
  | 'hidden';
