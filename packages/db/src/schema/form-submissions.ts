/**
 * Form submissions table schema.
 * Stores submitted form data.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { forms } from './forms.js';

export const formSubmissions = sqliteTable('form_submissions', {
  id: text('id').primaryKey(),
  formId: text('form_id')
    .notNull()
    .references(() => forms.id, { onDelete: 'cascade' }),

  // Submission data
  data: text('data').notNull(), // JSON: Form field values
  status: text('status', { enum: ['new', 'read', 'spam', 'archived'] })
    .notNull()
    .default('new'),

  // Metadata
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  referrer: text('referrer'),
  attachments: text('attachments'), // JSON: Array of file paths/URLs

  // Webhook tracking
  webhookSentAt: integer('webhook_sent_at', { mode: 'timestamp' }),
  webhookResponse: text('webhook_response'), // JSON: Webhook response data

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export type FormSubmission = typeof formSubmissions.$inferSelect;
export type NewFormSubmission = typeof formSubmissions.$inferInsert;

/**
 * Form submission status type.
 */
export type FormSubmissionStatus = 'new' | 'read' | 'spam' | 'archived';
