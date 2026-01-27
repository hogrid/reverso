/**
 * Schema sync service.
 * Syncs ProjectSchema from the scanner to the database.
 */

import type { FieldSchema, PageSchema, ProjectSchema, SectionSchema } from '@reverso/core';
import type { DrizzleDatabase } from '../connection.js';
import { deleteField, getFieldsBySectionId, upsertField } from '../queries/fields.js';
import { deletePage, getPages, upsertPage } from '../queries/pages.js';
import { deleteSection, getSectionsByPageId, upsertSection } from '../queries/sections.js';

export interface SyncResult {
  pages: {
    created: number;
    updated: number;
    deleted: number;
  };
  sections: {
    created: number;
    updated: number;
    deleted: number;
  };
  fields: {
    created: number;
    updated: number;
    deleted: number;
  };
  duration: number;
}

export interface SyncOptions {
  /** Delete pages/sections/fields that are no longer in the schema */
  deleteRemoved?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Sync a ProjectSchema to the database.
 */
export async function syncSchema(
  db: DrizzleDatabase,
  schema: ProjectSchema,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const startTime = Date.now();
  const { deleteRemoved = true, verbose = false } = options;

  const result: SyncResult = {
    pages: { created: 0, updated: 0, deleted: 0 },
    sections: { created: 0, updated: 0, deleted: 0 },
    fields: { created: 0, updated: 0, deleted: 0 },
    duration: 0,
  };

  // Track what we've synced for deletion detection
  const syncedPageSlugs = new Set<string>();
  const syncedSectionIds = new Set<string>();
  const syncedFieldPaths = new Set<string>();

  // Sync pages
  for (const pageSchema of schema.pages) {
    const page = await syncPage(db, pageSchema);
    syncedPageSlugs.add(page.slug);

    if (verbose) {
      console.log(`Synced page: ${page.slug}`);
    }

    // Sync sections
    for (let i = 0; i < pageSchema.sections.length; i++) {
      const sectionSchema = pageSchema.sections[i];
      if (!sectionSchema) continue;

      const section = await syncSection(db, page.id, sectionSchema, i);
      syncedSectionIds.add(section.id);

      if (verbose) {
        console.log(`  Synced section: ${section.slug}`);
      }

      // Sync fields
      for (let j = 0; j < sectionSchema.fields.length; j++) {
        const fieldSchema = sectionSchema.fields[j];
        if (!fieldSchema) continue;

        const field = await syncField(db, section.id, fieldSchema, j);
        syncedFieldPaths.add(field.path);

        if (verbose) {
          console.log(`    Synced field: ${field.path}`);
        }
      }
    }
  }

  // Delete removed items if requested
  if (deleteRemoved) {
    // Delete removed fields
    const allPages = await getPages(db);
    for (const page of allPages) {
      if (!syncedPageSlugs.has(page.slug)) {
        await deletePage(db, page.id);
        result.pages.deleted++;
        continue;
      }

      const sections = await getSectionsByPageId(db, page.id);
      for (const section of sections) {
        if (!syncedSectionIds.has(section.id)) {
          await deleteSection(db, section.id);
          result.sections.deleted++;
          continue;
        }

        const fields = await getFieldsBySectionId(db, section.id);
        for (const field of fields) {
          if (!syncedFieldPaths.has(field.path)) {
            await deleteField(db, field.id);
            result.fields.deleted++;
          }
        }
      }
    }
  }

  result.duration = Date.now() - startTime;
  return result;
}

/**
 * Sync a single page.
 */
async function syncPage(db: DrizzleDatabase, pageSchema: PageSchema) {
  return upsertPage(db, {
    slug: pageSchema.slug,
    name: pageSchema.name,
    sourceFiles: pageSchema.sourceFiles,
    fieldCount: pageSchema.fieldCount,
  });
}

/**
 * Sync a single section.
 */
async function syncSection(
  db: DrizzleDatabase,
  pageId: string,
  sectionSchema: SectionSchema,
  sortOrder: number
) {
  return upsertSection(db, {
    pageId,
    slug: sectionSchema.slug,
    name: sectionSchema.name,
    isRepeater: sectionSchema.isRepeater,
    repeaterConfig: sectionSchema.repeaterConfig,
    sortOrder,
  });
}

/**
 * Sync a single field.
 */
async function syncField(
  db: DrizzleDatabase,
  sectionId: string,
  fieldSchema: FieldSchema,
  sortOrder: number
) {
  return upsertField(db, {
    sectionId,
    path: fieldSchema.path,
    type: fieldSchema.type,
    label: fieldSchema.label,
    placeholder: fieldSchema.placeholder,
    required: fieldSchema.required,
    validation: fieldSchema.validation,
    options: fieldSchema.options ? parseOptions(fieldSchema.options) : undefined,
    condition: fieldSchema.condition,
    config: extractFieldConfig(fieldSchema),
    defaultValue: fieldSchema.defaultContent,
    help: fieldSchema.help,
    sourceFile: fieldSchema.file,
    sourceLine: fieldSchema.line,
    sourceColumn: fieldSchema.column,
    sortOrder,
  });
}

/**
 * Parse field options string into array.
 */
function parseOptions(options: string): unknown[] {
  // Try JSON first
  try {
    return JSON.parse(options);
  } catch {
    // Fall back to comma-separated values
    return options.split(',').map((opt) => {
      const trimmed = opt.trim();
      // Check for label:value format
      if (trimmed.includes(':')) {
        const [label, value] = trimmed.split(':').map((s) => s.trim());
        return { label, value };
      }
      return { label: trimmed, value: trimmed };
    });
  }
}

/**
 * Extract field-specific config from FieldSchema.
 */
function extractFieldConfig(fieldSchema: FieldSchema): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  if (fieldSchema.min !== undefined) config.min = fieldSchema.min;
  if (fieldSchema.max !== undefined) config.max = fieldSchema.max;
  if (fieldSchema.step !== undefined) config.step = fieldSchema.step;
  if (fieldSchema.accept !== undefined) config.accept = fieldSchema.accept;
  if (fieldSchema.multiple !== undefined) config.multiple = fieldSchema.multiple;
  if (fieldSchema.rows !== undefined) config.rows = fieldSchema.rows;
  if (fieldSchema.width !== undefined) config.width = fieldSchema.width;
  if (fieldSchema.readonly !== undefined) config.readonly = fieldSchema.readonly;
  if (fieldSchema.hidden !== undefined) config.hidden = fieldSchema.hidden;

  return Object.keys(config).length > 0 ? config : {};
}

/**
 * Get diff between current schema and new schema.
 */
export async function getSchemaChanges(
  db: DrizzleDatabase,
  schema: ProjectSchema
): Promise<{
  added: { pages: string[]; sections: string[]; fields: string[] };
  removed: { pages: string[]; sections: string[]; fields: string[] };
  modified: { pages: string[]; sections: string[]; fields: string[] };
}> {
  const result = {
    added: { pages: [] as string[], sections: [] as string[], fields: [] as string[] },
    removed: { pages: [] as string[], sections: [] as string[], fields: [] as string[] },
    modified: { pages: [] as string[], sections: [] as string[], fields: [] as string[] },
  };

  // Get current state from database
  const existingPages = await getPages(db);
  const existingPageSlugs = new Set(existingPages.map((p) => p.slug));

  // Build sets of new items
  const newPageSlugs = new Set(schema.pages.map((p) => p.slug));
  const newFieldPaths = new Set<string>();

  for (const page of schema.pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        newFieldPaths.add(field.path);
      }
    }
  }

  // Find added pages
  for (const slug of newPageSlugs) {
    if (!existingPageSlugs.has(slug)) {
      result.added.pages.push(slug);
    }
  }

  // Find removed pages
  for (const slug of existingPageSlugs) {
    if (!newPageSlugs.has(slug)) {
      result.removed.pages.push(slug);
    }
  }

  return result;
}
