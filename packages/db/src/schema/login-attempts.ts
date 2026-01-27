/**
 * Login attempts schema for brute force protection.
 */

import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Login attempts table for tracking failed authentication attempts.
 */
export const loginAttempts = sqliteTable('login_attempts', {
  id: text('id').primaryKey(),
  /** IP address or email key */
  key: text('key').notNull(),
  /** Number of failed attempts */
  attempts: integer('attempts').notNull().default(0),
  /** Locked until timestamp (null if not locked) */
  lockedUntil: integer('locked_until', { mode: 'timestamp' }),
  /** First attempt timestamp */
  firstAttemptAt: integer('first_attempt_at', { mode: 'timestamp' }).notNull(),
  /** Last attempt timestamp */
  lastAttemptAt: integer('last_attempt_at', { mode: 'timestamp' }).notNull(),
});

export type LoginAttempt = typeof loginAttempts.$inferSelect;
export type NewLoginAttempt = typeof loginAttempts.$inferInsert;
