/**
 * Field queries.
 */

import { eq, like } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { type Field, type NewField, fields } from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface CreateFieldInput {
  sectionId: string;
  path: string;
  type: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: string;
  options?: unknown[];
  condition?: string;
  config?: Record<string, unknown>;
  defaultValue?: string;
  help?: string;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
  sortOrder?: number;
}

export interface UpdateFieldInput {
  type?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  validation?: string;
  options?: unknown[];
  condition?: string;
  config?: Record<string, unknown>;
  defaultValue?: string;
  help?: string;
  sourceFile?: string;
  sourceLine?: number;
  sourceColumn?: number;
  sortOrder?: number;
}

/**
 * Create a new field.
 */
export async function createField(db: DrizzleDatabase, input: CreateFieldInput): Promise<Field> {
  const id = generateId();
  const timestamp = now();

  const newField: NewField = {
    id,
    sectionId: input.sectionId,
    path: input.path,
    type: input.type,
    label: input.label,
    placeholder: input.placeholder,
    required: input.required ?? false,
    validation: input.validation,
    options: toJson(input.options),
    condition: input.condition,
    config: toJson(input.config),
    defaultValue: input.defaultValue,
    help: input.help,
    sourceFile: input.sourceFile,
    sourceLine: input.sourceLine,
    sourceColumn: input.sourceColumn,
    sortOrder: input.sortOrder ?? 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(fields).values(newField);

  return {
    id,
    sectionId: input.sectionId,
    path: input.path,
    type: input.type,
    label: newField.label ?? null,
    placeholder: newField.placeholder ?? null,
    required: newField.required ?? null,
    validation: newField.validation ?? null,
    options: newField.options ?? null,
    condition: newField.condition ?? null,
    config: newField.config ?? null,
    defaultValue: newField.defaultValue ?? null,
    help: newField.help ?? null,
    sourceFile: newField.sourceFile ?? null,
    sourceLine: newField.sourceLine ?? null,
    sourceColumn: newField.sourceColumn ?? null,
    sortOrder: newField.sortOrder ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/**
 * Get all fields.
 */
export async function getFields(db: DrizzleDatabase): Promise<Field[]> {
  return db.select().from(fields).orderBy(fields.sortOrder);
}

/**
 * Get fields by section ID.
 */
export async function getFieldsBySectionId(
  db: DrizzleDatabase,
  sectionId: string
): Promise<Field[]> {
  return db.select().from(fields).where(eq(fields.sectionId, sectionId)).orderBy(fields.sortOrder);
}

/**
 * Get a field by ID.
 */
export async function getFieldById(db: DrizzleDatabase, id: string): Promise<Field | undefined> {
  const result = await db.select().from(fields).where(eq(fields.id, id)).limit(1);
  return result[0];
}

/**
 * Get a field by path.
 */
export async function getFieldByPath(
  db: DrizzleDatabase,
  path: string
): Promise<Field | undefined> {
  const result = await db.select().from(fields).where(eq(fields.path, path)).limit(1);
  return result[0];
}

/**
 * Get fields by path prefix (e.g., "home.hero.%").
 */
export async function getFieldsByPathPrefix(db: DrizzleDatabase, prefix: string): Promise<Field[]> {
  return db
    .select()
    .from(fields)
    .where(like(fields.path, `${prefix}%`))
    .orderBy(fields.sortOrder);
}

/**
 * Update a field.
 */
export async function updateField(
  db: DrizzleDatabase,
  id: string,
  input: UpdateFieldInput
): Promise<Field | undefined> {
  const existing = await getFieldById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewField> = {
    updatedAt: now(),
  };

  if (input.type !== undefined) updates.type = input.type;
  if (input.label !== undefined) updates.label = input.label;
  if (input.placeholder !== undefined) updates.placeholder = input.placeholder;
  if (input.required !== undefined) updates.required = input.required;
  if (input.validation !== undefined) updates.validation = input.validation;
  if (input.options !== undefined) updates.options = toJson(input.options);
  if (input.condition !== undefined) updates.condition = input.condition;
  if (input.config !== undefined) updates.config = toJson(input.config);
  if (input.defaultValue !== undefined) updates.defaultValue = input.defaultValue;
  if (input.help !== undefined) updates.help = input.help;
  if (input.sourceFile !== undefined) updates.sourceFile = input.sourceFile;
  if (input.sourceLine !== undefined) updates.sourceLine = input.sourceLine;
  if (input.sourceColumn !== undefined) updates.sourceColumn = input.sourceColumn;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;

  await db.update(fields).set(updates).where(eq(fields.id, id));

  return getFieldById(db, id);
}

/**
 * Delete a field.
 */
export async function deleteField(db: DrizzleDatabase, id: string): Promise<boolean> {
  await db.delete(fields).where(eq(fields.id, id));
  return true;
}

/**
 * Delete fields by section ID.
 */
export async function deleteFieldsBySectionId(
  db: DrizzleDatabase,
  sectionId: string
): Promise<boolean> {
  await db.delete(fields).where(eq(fields.sectionId, sectionId));
  return true;
}

/**
 * Upsert a field (create or update by path).
 */
export async function upsertField(db: DrizzleDatabase, input: CreateFieldInput): Promise<Field> {
  const existing = await getFieldByPath(db, input.path);

  if (existing) {
    const updated = await updateField(db, existing.id, {
      type: input.type,
      label: input.label,
      placeholder: input.placeholder,
      required: input.required,
      validation: input.validation,
      options: input.options,
      condition: input.condition,
      config: input.config,
      defaultValue: input.defaultValue,
      help: input.help,
      sourceFile: input.sourceFile,
      sourceLine: input.sourceLine,
      sourceColumn: input.sourceColumn,
      sortOrder: input.sortOrder,
    });
    return updated!;
  }

  return createField(db, input);
}

/**
 * Parse field options from JSON string.
 */
export function parseFieldOptions(field: Field): unknown[] {
  return parseJson<unknown[]>(field.options) ?? [];
}

/**
 * Parse field config from JSON string.
 */
export function parseFieldConfig(field: Field): Record<string, unknown> {
  return parseJson<Record<string, unknown>>(field.config) ?? {};
}
