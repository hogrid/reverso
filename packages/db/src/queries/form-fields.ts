/**
 * Form fields queries.
 */

import { and, eq, gt, gte, sql } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import {
  type FormField,
  type FormFieldType,
  type NewFormField,
  formFields,
} from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface FieldCondition {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'isEmpty' | 'isNotEmpty';
  value?: string | number | boolean;
}

export interface FieldConfig {
  options?: Array<{ label: string; value: string }>;
  accept?: string; // For file fields
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  rows?: number; // For textarea
  multiple?: boolean; // For select/file
}

export interface CreateFormFieldInput {
  formId: string;
  name: string;
  type: FormFieldType;
  label?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  validation?: string;
  config?: FieldConfig;
  width?: number;
  step?: number;
  sortOrder?: number;
  condition?: FieldCondition;
}

export interface UpdateFormFieldInput {
  name?: string;
  type?: FormFieldType;
  label?: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  validation?: string;
  config?: FieldConfig;
  width?: number;
  step?: number;
  sortOrder?: number;
  condition?: FieldCondition;
}

/**
 * Create a new form field.
 */
export async function createFormField(
  db: DrizzleDatabase,
  input: CreateFormFieldInput
): Promise<FormField> {
  const id = generateId();
  const timestamp = now();

  // Get max sort order for this form
  const maxOrder = await db
    .select({ max: sql<number>`COALESCE(MAX(${formFields.sortOrder}), -1)` })
    .from(formFields)
    .where(eq(formFields.formId, input.formId));

  const sortOrder = input.sortOrder ?? (maxOrder[0]?.max ?? -1) + 1;

  const newField: NewFormField = {
    id,
    formId: input.formId,
    name: input.name,
    type: input.type,
    label: input.label ?? null,
    placeholder: input.placeholder ?? null,
    help: input.help ?? null,
    required: input.required ?? false,
    validation: input.validation ?? null,
    config: toJson(input.config),
    width: input.width ?? 12,
    step: input.step ?? 1,
    sortOrder,
    condition: toJson(input.condition),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(formFields).values(newField);

  return {
    ...newField,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as FormField;
}

/**
 * Get all fields for a form.
 */
export async function getFormFields(db: DrizzleDatabase, formId: string): Promise<FormField[]> {
  return db
    .select()
    .from(formFields)
    .where(eq(formFields.formId, formId))
    .orderBy(formFields.step, formFields.sortOrder);
}

/**
 * Get fields for a specific step.
 */
export async function getFormFieldsByStep(
  db: DrizzleDatabase,
  formId: string,
  step: number
): Promise<FormField[]> {
  return db
    .select()
    .from(formFields)
    .where(and(eq(formFields.formId, formId), eq(formFields.step, step)))
    .orderBy(formFields.sortOrder);
}

/**
 * Get a field by ID.
 */
export async function getFormFieldById(
  db: DrizzleDatabase,
  id: string
): Promise<FormField | undefined> {
  const result = await db.select().from(formFields).where(eq(formFields.id, id)).limit(1);
  return result[0];
}

/**
 * Get a field by name within a form.
 */
export async function getFormFieldByName(
  db: DrizzleDatabase,
  formId: string,
  name: string
): Promise<FormField | undefined> {
  const result = await db
    .select()
    .from(formFields)
    .where(and(eq(formFields.formId, formId), eq(formFields.name, name)))
    .limit(1);
  return result[0];
}

/**
 * Update a form field.
 */
export async function updateFormField(
  db: DrizzleDatabase,
  id: string,
  input: UpdateFormFieldInput
): Promise<FormField | undefined> {
  const existing = await getFormFieldById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewFormField> = {
    updatedAt: now(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.type !== undefined) updates.type = input.type;
  if (input.label !== undefined) updates.label = input.label;
  if (input.placeholder !== undefined) updates.placeholder = input.placeholder;
  if (input.help !== undefined) updates.help = input.help;
  if (input.required !== undefined) updates.required = input.required;
  if (input.validation !== undefined) updates.validation = input.validation;
  if (input.config !== undefined) updates.config = toJson(input.config);
  if (input.width !== undefined) updates.width = input.width;
  if (input.step !== undefined) updates.step = input.step;
  if (input.sortOrder !== undefined) updates.sortOrder = input.sortOrder;
  if (input.condition !== undefined) updates.condition = toJson(input.condition);

  await db.update(formFields).set(updates).where(eq(formFields.id, id));

  return getFormFieldById(db, id);
}

/**
 * Delete a form field.
 */
export async function deleteFormField(
  db: DrizzleDatabase,
  id: string
): Promise<FormField | undefined> {
  const existing = await getFormFieldById(db, id);
  if (!existing) return undefined;

  await db.delete(formFields).where(eq(formFields.id, id));

  // Reorder remaining fields
  await db
    .update(formFields)
    .set({ sortOrder: sql`${formFields.sortOrder} - 1` })
    .where(
      and(eq(formFields.formId, existing.formId), gt(formFields.sortOrder, existing.sortOrder ?? 0))
    );

  return existing;
}

/**
 * Reorder form fields.
 */
export async function reorderFormFields(
  db: DrizzleDatabase,
  formId: string,
  fieldIds: string[]
): Promise<void> {
  for (let i = 0; i < fieldIds.length; i++) {
    const fieldId = fieldIds[i];
    if (fieldId) {
      await db
        .update(formFields)
        .set({ sortOrder: i, updatedAt: now() })
        .where(and(eq(formFields.id, fieldId), eq(formFields.formId, formId)));
    }
  }
}

/**
 * Duplicate fields from one form to another.
 */
export async function duplicateFormFields(
  db: DrizzleDatabase,
  sourceFormId: string,
  targetFormId: string
): Promise<FormField[]> {
  const sourceFields = await getFormFields(db, sourceFormId);
  const newFields: FormField[] = [];

  for (const field of sourceFields) {
    const newField = await createFormField(db, {
      formId: targetFormId,
      name: field.name,
      type: field.type as FormFieldType,
      label: field.label ?? undefined,
      placeholder: field.placeholder ?? undefined,
      help: field.help ?? undefined,
      required: field.required ?? false,
      validation: field.validation ?? undefined,
      config: parseFormFieldConfig(field),
      width: field.width ?? 12,
      step: field.step ?? 1,
      sortOrder: field.sortOrder ?? 0,
      condition: parseFormFieldCondition(field),
    });
    newFields.push(newField);
  }

  return newFields;
}

// Helper functions

export function parseFormFieldConfig(field: FormField): FieldConfig {
  return parseJson<FieldConfig>(field.config) ?? {};
}

export function parseFormFieldCondition(field: FormField): FieldCondition | undefined {
  return parseJson<FieldCondition>(field.condition) ?? undefined;
}
