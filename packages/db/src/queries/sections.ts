/**
 * Section queries.
 */

import { and, eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { type NewSection, type Section, sections } from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface RepeaterConfig {
  min?: number;
  max?: number;
  itemLabel?: string;
}

export interface CreateSectionInput {
  pageId: string;
  slug: string;
  name: string;
  isRepeater?: boolean;
  repeaterConfig?: RepeaterConfig;
  sortOrder?: number;
}

export interface UpdateSectionInput {
  name?: string;
  isRepeater?: boolean;
  repeaterConfig?: RepeaterConfig;
  sortOrder?: number;
}

/**
 * Create a new section.
 */
export async function createSection(
  db: DrizzleDatabase,
  input: CreateSectionInput
): Promise<Section> {
  const id = generateId();
  const timestamp = now();

  const newSection: NewSection = {
    id,
    pageId: input.pageId,
    slug: input.slug,
    name: input.name,
    isRepeater: input.isRepeater ?? false,
    repeaterConfig: toJson(input.repeaterConfig),
    sortOrder: input.sortOrder ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(sections).values(newSection);

  return {
    id,
    pageId: input.pageId,
    slug: input.slug,
    name: input.name,
    isRepeater: newSection.isRepeater ?? null,
    repeaterConfig: newSection.repeaterConfig ?? null,
    sortOrder: newSection.sortOrder ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Get all sections.
 */
export async function getSections(db: DrizzleDatabase): Promise<Section[]> {
  return db.select().from(sections).orderBy(sections.sortOrder);
}

/**
 * Get sections by page ID.
 */
export async function getSectionsByPageId(db: DrizzleDatabase, pageId: string): Promise<Section[]> {
  return db.select().from(sections).where(eq(sections.pageId, pageId)).orderBy(sections.sortOrder);
}

/**
 * Get a section by ID.
 */
export async function getSectionById(
  db: DrizzleDatabase,
  id: string
): Promise<Section | undefined> {
  const result = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
  return result[0];
}

/**
 * Get a section by page ID and slug.
 */
export async function getSectionBySlug(
  db: DrizzleDatabase,
  pageId: string,
  slug: string
): Promise<Section | undefined> {
  const result = await db
    .select()
    .from(sections)
    .where(and(eq(sections.pageId, pageId), eq(sections.slug, slug)))
    .limit(1);
  return result[0];
}

/**
 * Update a section.
 */
export async function updateSection(
  db: DrizzleDatabase,
  id: string,
  input: UpdateSectionInput
): Promise<Section | undefined> {
  const existing = await getSectionById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewSection> = {
    updatedAt: now(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.isRepeater !== undefined) updates.isRepeater = input.isRepeater;
  if (input.repeaterConfig !== undefined) updates.repeaterConfig = toJson(input.repeaterConfig);
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  await db.update(sections).set(updates).where(eq(sections.id, id));

  return getSectionById(db, id);
}

/**
 * Delete a section.
 */
export async function deleteSection(db: DrizzleDatabase, id: string): Promise<boolean> {
  await db.delete(sections).where(eq(sections.id, id));
  return true;
}

/**
 * Delete all sections for a page.
 */
export async function deleteSectionsByPageId(
  db: DrizzleDatabase,
  pageId: string
): Promise<boolean> {
  await db.delete(sections).where(eq(sections.pageId, pageId));
  return true;
}

/**
 * Upsert a section (create or update by page ID and slug).
 */
export async function upsertSection(
  db: DrizzleDatabase,
  input: CreateSectionInput
): Promise<Section> {
  const existing = await getSectionBySlug(db, input.pageId, input.slug);

  if (existing) {
    const updated = await updateSection(db, existing.id, {
      name: input.name,
      isRepeater: input.isRepeater,
      repeaterConfig: input.repeaterConfig,
      sortOrder: input.sortOrder,
    });
    return updated!;
  }

  return createSection(db, input);
}

/**
 * Parse repeater config from JSON string.
 */
export function parseRepeaterConfig(section: Section): RepeaterConfig | undefined {
  return parseJson<RepeaterConfig>(section.repeaterConfig) ?? undefined;
}
