/**
 * Forms table schema.
 * Stores form builder configurations.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const forms = sqliteTable('forms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  status: text('status', { enum: ['draft', 'published', 'archived'] })
    .notNull()
    .default('draft'),

  // Multi-step configuration
  isMultiStep: integer('is_multi_step', { mode: 'boolean' }).default(false),
  steps: text('steps'), // JSON: Array of { id, name, description }

  // Settings
  settings: text('settings'), // JSON: { submitButtonText, successMessage, redirectUrl }

  // Notifications
  notifyEmails: text('notify_emails'), // JSON: Array of email addresses
  notifyOnSubmission: integer('notify_on_submission', { mode: 'boolean' }).default(true),

  // Webhooks
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret'),
  webhookEnabled: integer('webhook_enabled', { mode: 'boolean' }).default(false),

  // Security
  honeypotEnabled: integer('honeypot_enabled', { mode: 'boolean' }).default(true),
  rateLimitPerMinute: integer('rate_limit_per_minute').default(10),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Form = typeof forms.$inferSelect;
export type NewForm = typeof forms.$inferInsert;

/**
 * Form status type.
 */
export type FormStatus = 'draft' | 'published' | 'archived';
