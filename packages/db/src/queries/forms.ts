/**
 * Forms queries.
 */

import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { type Form, type FormStatus, type NewForm, forms } from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface FormStep {
  id: string;
  name: string;
  description?: string;
}

export interface FormSettings {
  submitButtonText?: string;
  successMessage?: string;
  redirectUrl?: string;
}

export interface CreateFormInput {
  name: string;
  slug: string;
  description?: string;
  status?: FormStatus;
  isMultiStep?: boolean;
  steps?: FormStep[];
  settings?: FormSettings;
  notifyEmails?: string[];
  notifyOnSubmission?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled?: boolean;
  honeypotEnabled?: boolean;
  rateLimitPerMinute?: number;
}

export interface UpdateFormInput {
  name?: string;
  slug?: string;
  description?: string;
  status?: FormStatus;
  isMultiStep?: boolean;
  steps?: FormStep[];
  settings?: FormSettings;
  notifyEmails?: string[];
  notifyOnSubmission?: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEnabled?: boolean;
  honeypotEnabled?: boolean;
  rateLimitPerMinute?: number;
}

/**
 * Create a new form.
 */
export async function createForm(db: DrizzleDatabase, input: CreateFormInput): Promise<Form> {
  const id = generateId();
  const timestamp = now();

  const newForm: NewForm = {
    id,
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    status: input.status ?? 'draft',
    isMultiStep: input.isMultiStep ?? false,
    steps: toJson(input.steps),
    settings: toJson(input.settings),
    notifyEmails: toJson(input.notifyEmails),
    notifyOnSubmission: input.notifyOnSubmission ?? true,
    webhookUrl: input.webhookUrl ?? null,
    webhookSecret: input.webhookSecret ?? null,
    webhookEnabled: input.webhookEnabled ?? false,
    honeypotEnabled: input.honeypotEnabled ?? true,
    rateLimitPerMinute: input.rateLimitPerMinute ?? 10,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(forms).values(newForm);

  return {
    ...newForm,
    createdAt: timestamp,
    updatedAt: timestamp,
  } as Form;
}

/**
 * Get all forms.
 */
export async function getForms(db: DrizzleDatabase): Promise<Form[]> {
  return db.select().from(forms).orderBy(forms.name);
}

/**
 * Get forms by status.
 */
export async function getFormsByStatus(db: DrizzleDatabase, status: FormStatus): Promise<Form[]> {
  return db.select().from(forms).where(eq(forms.status, status)).orderBy(forms.name);
}

/**
 * Get a form by ID.
 */
export async function getFormById(db: DrizzleDatabase, id: string): Promise<Form | undefined> {
  const result = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  return result[0];
}

/**
 * Get a form by slug.
 */
export async function getFormBySlug(db: DrizzleDatabase, slug: string): Promise<Form | undefined> {
  const result = await db.select().from(forms).where(eq(forms.slug, slug)).limit(1);
  return result[0];
}

/**
 * Update a form.
 */
export async function updateForm(
  db: DrizzleDatabase,
  id: string,
  input: UpdateFormInput
): Promise<Form | undefined> {
  const existing = await getFormById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewForm> = {
    updatedAt: now(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.description !== undefined) updates.description = input.description;
  if (input.status !== undefined) updates.status = input.status;
  if (input.isMultiStep !== undefined) updates.isMultiStep = input.isMultiStep;
  if (input.steps !== undefined) updates.steps = toJson(input.steps);
  if (input.settings !== undefined) updates.settings = toJson(input.settings);
  if (input.notifyEmails !== undefined) updates.notifyEmails = toJson(input.notifyEmails);
  if (input.notifyOnSubmission !== undefined) updates.notifyOnSubmission = input.notifyOnSubmission;
  if (input.webhookUrl !== undefined) updates.webhookUrl = input.webhookUrl;
  if (input.webhookSecret !== undefined) updates.webhookSecret = input.webhookSecret;
  if (input.webhookEnabled !== undefined) updates.webhookEnabled = input.webhookEnabled;
  if (input.honeypotEnabled !== undefined) updates.honeypotEnabled = input.honeypotEnabled;
  if (input.rateLimitPerMinute !== undefined) updates.rateLimitPerMinute = input.rateLimitPerMinute;

  await db.update(forms).set(updates).where(eq(forms.id, id));

  return getFormById(db, id);
}

/**
 * Delete a form.
 */
export async function deleteForm(db: DrizzleDatabase, id: string): Promise<Form | undefined> {
  const existing = await getFormById(db, id);
  if (!existing) return undefined;

  await db.delete(forms).where(eq(forms.id, id));
  return existing;
}

/**
 * Publish a form.
 */
export async function publishForm(db: DrizzleDatabase, id: string): Promise<Form | undefined> {
  return updateForm(db, id, { status: 'published' });
}

/**
 * Unpublish a form (set to draft).
 */
export async function unpublishForm(db: DrizzleDatabase, id: string): Promise<Form | undefined> {
  return updateForm(db, id, { status: 'draft' });
}

/**
 * Duplicate a form.
 */
export async function duplicateForm(
  db: DrizzleDatabase,
  id: string,
  newSlug: string
): Promise<Form | undefined> {
  const existing = await getFormById(db, id);
  if (!existing) return undefined;

  return createForm(db, {
    name: `${existing.name} (Copy)`,
    slug: newSlug,
    description: existing.description ?? undefined,
    status: 'draft',
    isMultiStep: existing.isMultiStep ?? false,
    steps: parseFormSteps(existing),
    settings: parseFormSettings(existing),
    notifyEmails: parseNotifyEmails(existing),
    notifyOnSubmission: existing.notifyOnSubmission ?? true,
    webhookUrl: existing.webhookUrl ?? undefined,
    webhookEnabled: false, // Disable webhook on duplicate
    honeypotEnabled: existing.honeypotEnabled ?? true,
    rateLimitPerMinute: existing.rateLimitPerMinute ?? 10,
  });
}

// Helper functions

export function parseFormSteps(form: Form): FormStep[] {
  return parseJson<FormStep[]>(form.steps) ?? [];
}

export function parseFormSettings(form: Form): FormSettings {
  return parseJson<FormSettings>(form.settings) ?? {};
}

export function parseNotifyEmails(form: Form): string[] {
  return parseJson<string[]>(form.notifyEmails) ?? [];
}
