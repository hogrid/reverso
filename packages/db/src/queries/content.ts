/**
 * Content queries.
 */

import type { ContentValue } from '@reverso/core';
import { and, eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import {
  type Content,
  type ContentHistory,
  type NewContent,
  type NewContentHistory,
  content,
  contentHistory,
  fields,
} from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface CreateContentInput {
  fieldId: string;
  locale?: string;
  value: ContentValue;
  published?: boolean;
}

export interface UpdateContentInput {
  value?: ContentValue;
  published?: boolean;
  changedBy?: string;
}

/**
 * Create new content.
 */
export async function createContent(
  db: DrizzleDatabase,
  input: CreateContentInput
): Promise<Content> {
  const id = generateId();
  const timestamp = now();

  const newContent: NewContent = {
    id,
    fieldId: input.fieldId,
    locale: input.locale ?? 'default',
    value: toJson(input.value),
    published: input.published ?? false,
    publishedAt: input.published ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(content).values(newContent);

  return {
    id,
    fieldId: input.fieldId,
    locale: newContent.locale ?? 'default',
    value: newContent.value ?? null,
    published: newContent.published ?? null,
    publishedAt: newContent.publishedAt ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Get all content.
 */
export async function getAllContent(db: DrizzleDatabase): Promise<Content[]> {
  return db.select().from(content);
}

/**
 * Get content by ID.
 */
export async function getContentById(
  db: DrizzleDatabase,
  id: string
): Promise<Content | undefined> {
  const result = await db.select().from(content).where(eq(content.id, id)).limit(1);
  return result[0];
}

/**
 * Get content by field ID and locale.
 */
export async function getContentByFieldId(
  db: DrizzleDatabase,
  fieldId: string,
  locale = 'default'
): Promise<Content | undefined> {
  const result = await db
    .select()
    .from(content)
    .where(and(eq(content.fieldId, fieldId), eq(content.locale, locale)))
    .limit(1);
  return result[0];
}

/**
 * Get content by field path and locale.
 */
export async function getContentByPath(
  db: DrizzleDatabase,
  path: string,
  locale = 'default'
): Promise<Content | undefined> {
  const result = await db
    .select({ content })
    .from(content)
    .innerJoin(fields, eq(content.fieldId, fields.id))
    .where(and(eq(fields.path, path), eq(content.locale, locale)))
    .limit(1);
  return result[0]?.content;
}

/**
 * Get all content for a field path prefix (page or section).
 */
export async function getContentByPathPrefix(
  db: DrizzleDatabase,
  prefix: string,
  locale = 'default'
): Promise<Array<{ path: string; content: Content }>> {
  const result = await db
    .select({ path: fields.path, content })
    .from(content)
    .innerJoin(fields, eq(content.fieldId, fields.id))
    .where(eq(content.locale, locale));

  // Filter by prefix in memory (SQLite LIKE is case-insensitive by default)
  return result.filter((r) => r.path.startsWith(prefix));
}

/**
 * Update content.
 */
export async function updateContent(
  db: DrizzleDatabase,
  id: string,
  input: UpdateContentInput
): Promise<Content | undefined> {
  const existing = await getContentById(db, id);
  if (!existing) return undefined;

  const timestamp = now();
  const updates: Partial<NewContent> = {
    updatedAt: timestamp,
  };

  // Save history if value is changing
  if (input.value !== undefined && existing.value !== toJson(input.value)) {
    await createContentHistory(db, {
      contentId: id,
      value: parseJson<ContentValue>(existing.value) ?? null,
      changedBy: input.changedBy,
    });
    updates.value = toJson(input.value);
  }

  if (input.published !== undefined) {
    updates.published = input.published;
    if (input.published && !existing.published) {
      updates.publishedAt = timestamp;
    }
  }

  await db.update(content).set(updates).where(eq(content.id, id));

  return getContentById(db, id);
}

/**
 * Delete content.
 */
export async function deleteContent(db: DrizzleDatabase, id: string): Promise<boolean> {
  await db.delete(content).where(eq(content.id, id));
  return true;
}

/**
 * Upsert content (create or update by field ID and locale).
 */
export async function upsertContent(
  db: DrizzleDatabase,
  input: CreateContentInput & { changedBy?: string }
): Promise<Content> {
  const existing = await getContentByFieldId(db, input.fieldId, input.locale ?? 'default');

  if (existing) {
    const updated = await updateContent(db, existing.id, {
      value: input.value,
      published: input.published,
      changedBy: input.changedBy,
    });
    return updated!;
  }

  return createContent(db, input);
}

/**
 * Bulk update content values.
 */
export async function bulkUpdateContent(
  db: DrizzleDatabase,
  updates: Array<{
    path: string;
    value: ContentValue;
    locale?: string;
    changedBy?: string;
  }>
): Promise<Content[]> {
  const results: Content[] = [];

  for (const update of updates) {
    const field = await db.select().from(fields).where(eq(fields.path, update.path)).limit(1);

    if (field[0]) {
      const result = await upsertContent(db, {
        fieldId: field[0].id,
        locale: update.locale,
        value: update.value,
        changedBy: update.changedBy,
      });
      results.push(result);
    }
  }

  return results;
}

/**
 * Publish content.
 */
export async function publishContent(
  db: DrizzleDatabase,
  id: string
): Promise<Content | undefined> {
  return updateContent(db, id, { published: true });
}

/**
 * Unpublish content.
 */
export async function unpublishContent(
  db: DrizzleDatabase,
  id: string
): Promise<Content | undefined> {
  const existing = await getContentById(db, id);
  if (!existing) return undefined;

  await db.update(content).set({ published: false, updatedAt: now() }).where(eq(content.id, id));

  return getContentById(db, id);
}

/**
 * Create content history entry.
 */
async function createContentHistory(
  db: DrizzleDatabase,
  input: {
    contentId: string;
    value: ContentValue | null;
    changedBy?: string;
  }
): Promise<ContentHistory> {
  const id = generateId();
  const timestamp = now();

  const history: NewContentHistory = {
    id,
    contentId: input.contentId,
    value: toJson(input.value),
    changedBy: input.changedBy,
    changedAt: timestamp,
  };

  await db.insert(contentHistory).values(history);

  return {
    id,
    contentId: input.contentId,
    value: history.value ?? null,
    changedBy: history.changedBy ?? null,
    changedAt: timestamp,
  };
}

/**
 * Get content history.
 */
export async function getContentHistory(
  db: DrizzleDatabase,
  contentId: string
): Promise<ContentHistory[]> {
  return db
    .select()
    .from(contentHistory)
    .where(eq(contentHistory.contentId, contentId))
    .orderBy(contentHistory.changedAt);
}

/**
 * Parse content value from JSON string.
 */
export function parseContentValue(record: Content): ContentValue | null {
  return parseJson<ContentValue>(record.value);
}
