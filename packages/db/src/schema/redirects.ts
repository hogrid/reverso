/**
 * Redirects table schema.
 * Stores URL redirects for SEO purposes.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const redirects = sqliteTable('redirects', {
  id: text('id').primaryKey(),
  fromPath: text('from_path').notNull().unique(), // Source path (e.g., /old-page)
  toPath: text('to_path').notNull(), // Destination path (e.g., /new-page)
  statusCode: integer('status_code').notNull().default(301), // 301, 302, 307, 308

  // Status
  isEnabled: integer('is_enabled', { mode: 'boolean' }).default(true),

  // Analytics
  hitCount: integer('hit_count').default(0),
  lastHitAt: integer('last_hit_at', { mode: 'timestamp' }),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Redirect = typeof redirects.$inferSelect;
export type NewRedirect = typeof redirects.$inferInsert;

/**
 * Redirect status code type.
 */
export type RedirectStatusCode = 301 | 302 | 307 | 308;
