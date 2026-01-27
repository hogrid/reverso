/**
 * Redirects queries.
 */

import { count, eq, sql } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import {
  type NewRedirect,
  type Redirect,
  type RedirectStatusCode,
  redirects,
} from '../schema/index.js';
import { generateId, now } from '../utils.js';

export interface CreateRedirectInput {
  fromPath: string;
  toPath: string;
  statusCode?: RedirectStatusCode;
  isEnabled?: boolean;
}

export interface UpdateRedirectInput {
  fromPath?: string;
  toPath?: string;
  statusCode?: RedirectStatusCode;
  isEnabled?: boolean;
}

export interface RedirectListOptions {
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Create a new redirect.
 */
export async function createRedirect(
  db: DrizzleDatabase,
  input: CreateRedirectInput
): Promise<Redirect> {
  const id = generateId();
  const timestamp = now();

  const newRedirect: NewRedirect = {
    id,
    fromPath: input.fromPath,
    toPath: input.toPath,
    statusCode: input.statusCode ?? 301,
    isEnabled: input.isEnabled ?? true,
    hitCount: 0,
    lastHitAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(redirects).values(newRedirect);

  return {
    ...newRedirect,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as Redirect;
}

/**
 * Get all redirects.
 */
export async function getRedirects(
  db: DrizzleDatabase,
  options: RedirectListOptions = {}
): Promise<Redirect[]> {
  const { isEnabled, limit = 100, offset = 0 } = options;

  let query = db.select().from(redirects);

  if (isEnabled !== undefined) {
    query = query.where(eq(redirects.isEnabled, isEnabled)) as typeof query;
  }

  return query.orderBy(redirects.fromPath).limit(limit).offset(offset);
}

/**
 * Get enabled redirects.
 */
export async function getEnabledRedirects(db: DrizzleDatabase): Promise<Redirect[]> {
  return getRedirects(db, { isEnabled: true });
}

/**
 * Get a redirect by ID.
 */
export async function getRedirectById(
  db: DrizzleDatabase,
  id: string
): Promise<Redirect | undefined> {
  const result = await db.select().from(redirects).where(eq(redirects.id, id)).limit(1);
  return result[0];
}

/**
 * Get a redirect by fromPath.
 */
export async function getRedirectByFromPath(
  db: DrizzleDatabase,
  fromPath: string
): Promise<Redirect | undefined> {
  const result = await db.select().from(redirects).where(eq(redirects.fromPath, fromPath)).limit(1);
  return result[0];
}

/**
 * Update a redirect.
 */
export async function updateRedirect(
  db: DrizzleDatabase,
  id: string,
  input: UpdateRedirectInput
): Promise<Redirect | undefined> {
  const existing = await getRedirectById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewRedirect> = {
    updatedAt: now(),
  };

  if (input.fromPath !== undefined) updates.fromPath = input.fromPath;
  if (input.toPath !== undefined) updates.toPath = input.toPath;
  if (input.statusCode !== undefined) updates.statusCode = input.statusCode;
  if (input.isEnabled !== undefined) updates.isEnabled = input.isEnabled;

  await db.update(redirects).set(updates).where(eq(redirects.id, id));

  return getRedirectById(db, id);
}

/**
 * Delete a redirect.
 */
export async function deleteRedirect(
  db: DrizzleDatabase,
  id: string
): Promise<Redirect | undefined> {
  const existing = await getRedirectById(db, id);
  if (!existing) return undefined;

  await db.delete(redirects).where(eq(redirects.id, id));
  return existing;
}

/**
 * Enable a redirect.
 */
export async function enableRedirect(
  db: DrizzleDatabase,
  id: string
): Promise<Redirect | undefined> {
  return updateRedirect(db, id, { isEnabled: true });
}

/**
 * Disable a redirect.
 */
export async function disableRedirect(
  db: DrizzleDatabase,
  id: string
): Promise<Redirect | undefined> {
  return updateRedirect(db, id, { isEnabled: false });
}

/**
 * Record a redirect hit.
 */
export async function recordRedirectHit(
  db: DrizzleDatabase,
  id: string
): Promise<Redirect | undefined> {
  const existing = await getRedirectById(db, id);
  if (!existing) return undefined;

  await db
    .update(redirects)
    .set({
      hitCount: sql`${redirects.hitCount} + 1`,
      lastHitAt: now(),
    })
    .where(eq(redirects.id, id));

  return getRedirectById(db, id);
}

/**
 * Bulk create redirects.
 */
export async function bulkCreateRedirects(
  db: DrizzleDatabase,
  inputs: CreateRedirectInput[]
): Promise<{ created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const input of inputs) {
    try {
      // Check if redirect already exists
      const existing = await getRedirectByFromPath(db, input.fromPath);
      if (existing) {
        skipped++;
        continue;
      }

      await createRedirect(db, input);
      created++;
    } catch (error) {
      errors.push(`Failed to create redirect for ${input.fromPath}: ${error}`);
    }
  }

  return { created, skipped, errors };
}

/**
 * Get redirect count.
 */
export async function getRedirectCount(db: DrizzleDatabase, isEnabled?: boolean): Promise<number> {
  let query = db.select({ count: count() }).from(redirects);

  if (isEnabled !== undefined) {
    query = query.where(eq(redirects.isEnabled, isEnabled)) as typeof query;
  }

  const result = await query;
  return result[0]?.count ?? 0;
}

/**
 * Get redirect stats.
 */
export async function getRedirectStats(
  db: DrizzleDatabase
): Promise<{ total: number; enabled: number; disabled: number; totalHits: number }> {
  const [total, enabled, disabled] = await Promise.all([
    getRedirectCount(db),
    getRedirectCount(db, true),
    getRedirectCount(db, false),
  ]);

  const hitResult = await db
    .select({ totalHits: sql<number>`COALESCE(SUM(${redirects.hitCount}), 0)` })
    .from(redirects);

  return {
    total,
    enabled,
    disabled,
    totalHits: hitResult[0]?.totalHits ?? 0,
  };
}
