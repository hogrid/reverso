/**
 * Database utilities.
 */

import { randomBytes } from 'node:crypto';

/**
 * Generate a unique ID for database records.
 * Uses nanoid-style format with 21 characters.
 */
export function generateId(): string {
  const bytes = randomBytes(16);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (const byte of bytes) {
    result += chars[byte % chars.length];
  }

  return result.slice(0, 21);
}

/**
 * Get current timestamp as Date object.
 */
export function now(): Date {
  return new Date();
}

/**
 * Parse JSON safely, returning null on error.
 */
export function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Stringify value to JSON, returning null for null/undefined.
 */
export function toJson<T>(value: T | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}
