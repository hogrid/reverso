/**
 * Login attempts queries for brute force protection.
 */

import crypto from 'node:crypto';
import { eq, lt } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { loginAttempts } from '../schema/login-attempts.js';
import type { LoginAttempt } from '../schema/login-attempts.js';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Get login attempt record by key (IP or email).
 */
export async function getLoginAttempt(
  db: DrizzleDatabase,
  key: string
): Promise<LoginAttempt | null> {
  const result = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.key, key))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Check if a key is currently locked out.
 */
export async function isLockedOut(
  db: DrizzleDatabase,
  key: string
): Promise<{ locked: boolean; remainingSeconds: number }> {
  const attempt = await getLoginAttempt(db, key);

  if (!attempt || !attempt.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  const now = Date.now();
  const lockedUntilMs = attempt.lockedUntil.getTime();

  if (lockedUntilMs > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((lockedUntilMs - now) / 1000),
    };
  }

  // Lockout expired, clear the record
  await clearLoginAttempts(db, key);
  return { locked: false, remainingSeconds: 0 };
}

/**
 * Record a failed login attempt.
 */
export async function recordFailedLoginAttempt(
  db: DrizzleDatabase,
  key: string
): Promise<{ locked: boolean; attempts: number }> {
  const now = new Date();
  const attempt = await getLoginAttempt(db, key);

  if (!attempt) {
    // First attempt
    await db.insert(loginAttempts).values({
      id: crypto.randomUUID(),
      key,
      attempts: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
    });
    return { locked: false, attempts: 1 };
  }

  // Check if the first attempt is outside the window - reset if so
  const windowStart = Date.now() - ATTEMPT_WINDOW_MS;
  if (attempt.firstAttemptAt.getTime() < windowStart) {
    await db.update(loginAttempts)
      .set({
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
        lockedUntil: null,
      })
      .where(eq(loginAttempts.key, key));
    return { locked: false, attempts: 1 };
  }

  const newAttempts = attempt.attempts + 1;
  const shouldLock = newAttempts >= MAX_ATTEMPTS;

  await db.update(loginAttempts)
    .set({
      attempts: newAttempts,
      lastAttemptAt: now,
      lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
    })
    .where(eq(loginAttempts.key, key));

  return { locked: shouldLock, attempts: newAttempts };
}

/**
 * Clear login attempts for a key (on successful login).
 */
export async function clearLoginAttempts(
  db: DrizzleDatabase,
  key: string
): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}

/**
 * Clean up old login attempt records.
 * Should be called periodically (e.g., daily cron job).
 */
export async function cleanupOldLoginAttempts(
  db: DrizzleDatabase
): Promise<number> {
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MS * 2);
  const result = await db
    .delete(loginAttempts)
    .where(lt(loginAttempts.lastAttemptAt, cutoff));

  return result.changes ?? 0;
}
