/**
 * Convert a stored field row into the `FieldSchema` shape the admin panel and
 * the scanner share. Used by every route that exposes fields so that options,
 * validation, help text and type-specific config are never dropped.
 */

import type { FieldSchema } from '@reverso/core';
import { type Field, parseFieldConfig } from '@reverso/db';

export function toFieldSchema(field: Field): FieldSchema {
  return {
    path: field.path,
    type: field.type as FieldSchema['type'],
    label: field.label ?? undefined,
    placeholder: field.placeholder ?? undefined,
    required: field.required ?? undefined,
    validation: field.validation ?? undefined,
    // Stored as a JSON array; the admin's parseOptions accepts the JSON string.
    options: field.options ?? undefined,
    condition: field.condition ?? undefined,
    file: field.sourceFile ?? '',
    line: field.sourceLine ?? 0,
    column: field.sourceColumn ?? 0,
    defaultContent: field.defaultValue ?? undefined,
    help: field.help ?? undefined,
    ...parseFieldConfig(field),
  };
}
