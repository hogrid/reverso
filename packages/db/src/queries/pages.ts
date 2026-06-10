/**
 * Page queries.
 */

import { eq, sql } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { type NewPage, type Page, fields, pages, sections } from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface CreatePageInput {
  slug: string;
  name: string;
  sourceFiles?: string[];
  fieldCount?: number;
}

export interface UpdatePageInput {
  name?: string;
  sourceFiles?: string[];
  fieldCount?: number;
}

/**
 * Create a new page.
 */
export async function createPage(db: DrizzleDatabase, input: CreatePageInput): Promise<Page> {
  const id = generateId();
  const timestamp = now();

  const newPage: NewPage = {
    id,
    slug: input.slug,
    name: input.name,
    sourceFiles: toJson(input.sourceFiles ?? []),
    fieldCount: input.fieldCount ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(pages).values(newPage);

  return {
    id,
    slug: input.slug,
    name: input.name,
    sourceFiles: newPage.sourceFiles ?? null,
    fieldCount: newPage.fieldCount ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Get all pages.
 */
export async function getPages(db: DrizzleDatabase): Promise<Page[]> {
  return db.select().from(pages).orderBy(pages.slug);
}

/**
 * Get a page by ID.
 */
export async function getPageById(db: DrizzleDatabase, id: string): Promise<Page | undefined> {
  const result = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return result[0];
}

/**
 * Get a page by slug.
 */
export async function getPageBySlug(db: DrizzleDatabase, slug: string): Promise<Page | undefined> {
  const result = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return result[0];
}

/**
 * Update a page.
 */
export async function updatePage(
  db: DrizzleDatabase,
  id: string,
  input: UpdatePageInput
): Promise<Page | undefined> {
  const existing = await getPageById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewPage> = {
    updatedAt: now(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.sourceFiles !== undefined) updates.sourceFiles = toJson(input.sourceFiles);
  if (input.fieldCount !== undefined) updates.fieldCount = input.fieldCount;

  await db.update(pages).set(updates).where(eq(pages.id, id));

  return getPageById(db, id);
}

/**
 * Delete a page.
 * Returns the deleted page if found, undefined otherwise.
 */
export async function deletePage(db: DrizzleDatabase, id: string): Promise<Page | undefined> {
  const existing = await getPageById(db, id);
  if (!existing) return undefined;

  await db.delete(pages).where(eq(pages.id, id));
  return existing;
}

/**
 * Upsert a page (create or update by slug).
 */
export async function upsertPage(db: DrizzleDatabase, input: CreatePageInput): Promise<Page> {
  const existing = await getPageBySlug(db, input.slug);

  if (existing) {
    const updated = await updatePage(db, existing.id, {
      name: input.name,
      sourceFiles: input.sourceFiles,
      fieldCount: input.fieldCount,
    });
    return updated!;
  }

  return createPage(db, input);
}

/**
 * Parse source files from JSON string.
 */
export function parseSourceFiles(page: Page): string[] {
  return parseJson<string[]>(page.sourceFiles) ?? [];
}

export interface SchemaStats {
  pages: number;
  sections: number;
  fields: number;
}

/**
 * Get aggregate schema counts (pages, sections, fields) in three COUNT queries
 * instead of walking the page → section → field tree (avoids N+1).
 */
export async function getSchemaStats(db: DrizzleDatabase): Promise<SchemaStats> {
  const [pageRow] = await db.select({ count: sql<number>`count(*)` }).from(pages);
  const [sectionRow] = await db.select({ count: sql<number>`count(*)` }).from(sections);
  const [fieldRow] = await db.select({ count: sql<number>`count(*)` }).from(fields);

  return {
    pages: Number(pageRow?.count ?? 0),
    sections: Number(sectionRow?.count ?? 0),
    fields: Number(fieldRow?.count ?? 0),
  };
}
