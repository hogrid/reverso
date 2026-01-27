/**
 * JSON schema output writer.
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FieldSchema, ProjectSchema, SchemaDiff } from '@reverso/core';
import { SCHEMA_FILE_NAME } from '@reverso/core';

/**
 * Options for writing JSON schema.
 */
export interface JsonWriterOptions {
  /** Output directory */
  outputDir: string;
  /** Pretty print JSON (default: true) */
  pretty?: boolean;
  /** Indent size for pretty printing (default: 2) */
  indent?: number;
}

/**
 * Write schema to a JSON file.
 */
export async function writeJsonSchema(
  schema: ProjectSchema,
  options: JsonWriterOptions
): Promise<string> {
  const outputPath = join(options.outputDir, SCHEMA_FILE_NAME);

  // Ensure output directory exists
  if (!existsSync(options.outputDir)) {
    await mkdir(options.outputDir, { recursive: true });
  }

  // Serialize to JSON
  const pretty = options.pretty !== false;
  const indent = options.indent ?? 2;
  const content = pretty ? JSON.stringify(schema, null, indent) : JSON.stringify(schema);

  // Write file
  await writeFile(outputPath, content, 'utf-8');

  return outputPath;
}

/**
 * Read existing schema from JSON file.
 */
export async function readJsonSchema(options: JsonWriterOptions): Promise<ProjectSchema | null> {
  const outputPath = join(options.outputDir, SCHEMA_FILE_NAME);

  if (!existsSync(outputPath)) {
    return null;
  }

  try {
    const content = await readFile(outputPath, 'utf-8');
    return JSON.parse(content) as ProjectSchema;
  } catch {
    return null;
  }
}

/**
 * Compare two schemas and return the differences.
 */
export function compareSchemas(before: ProjectSchema | null, after: ProjectSchema): SchemaDiff {
  if (!before) {
    // Everything is new
    const allFields = after.pages.flatMap((page) =>
      page.sections.flatMap((section) => section.fields)
    );
    return {
      added: allFields,
      removed: [],
      modified: [],
      hasChanges: allFields.length > 0,
    };
  }

  const beforeFields = new Map<string, FieldSchema>();
  const afterFields = new Map<string, FieldSchema>();

  // Collect all fields from before schema
  for (const page of before.pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        beforeFields.set(field.path, field);
      }
    }
  }

  // Collect all fields from after schema
  for (const page of after.pages) {
    for (const section of page.sections) {
      for (const field of section.fields) {
        afterFields.set(field.path, field);
      }
    }
  }

  // Find added fields
  const added: FieldSchema[] = [];
  for (const [path, field] of afterFields) {
    if (!beforeFields.has(path)) {
      added.push(field);
    }
  }

  // Find removed fields
  const removed: FieldSchema[] = [];
  for (const [path, field] of beforeFields) {
    if (!afterFields.has(path)) {
      removed.push(field);
    }
  }

  // Find modified fields
  const modified: SchemaDiff['modified'] = [];
  for (const [path, afterField] of afterFields) {
    const beforeField = beforeFields.get(path);
    if (beforeField) {
      const changes = getFieldChanges(beforeField, afterField);
      if (changes.length > 0) {
        modified.push({
          path,
          before: beforeField,
          after: afterField,
          changes,
        });
      }
    }
  }

  return {
    added,
    removed,
    modified,
    hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0,
  };
}

/**
 * Get the list of changed properties between two fields.
 */
function getFieldChanges(before: FieldSchema, after: FieldSchema): string[] {
  const changes: string[] = [];

  const keys: (keyof FieldSchema)[] = [
    'type',
    'label',
    'placeholder',
    'required',
    'validation',
    'options',
    'condition',
    'help',
    'min',
    'max',
    'step',
    'accept',
    'multiple',
    'rows',
    'width',
    'readonly',
    'hidden',
  ];

  for (const key of keys) {
    if (before[key] !== after[key]) {
      changes.push(key);
    }
  }

  return changes;
}

/**
 * Format schema diff as a human-readable string.
 */
export function formatSchemaDiff(diff: SchemaDiff): string {
  const lines: string[] = [];

  if (diff.added.length > 0) {
    lines.push(`Added (${diff.added.length}):`);
    for (const field of diff.added) {
      lines.push(`  + ${field.path} (${field.type})`);
    }
  }

  if (diff.removed.length > 0) {
    lines.push(`Removed (${diff.removed.length}):`);
    for (const field of diff.removed) {
      lines.push(`  - ${field.path} (${field.type})`);
    }
  }

  if (diff.modified.length > 0) {
    lines.push(`Modified (${diff.modified.length}):`);
    for (const mod of diff.modified) {
      lines.push(`  ~ ${mod.path}: ${mod.changes.join(', ')}`);
    }
  }

  if (!diff.hasChanges) {
    lines.push('No changes detected.');
  }

  return lines.join('\n');
}
