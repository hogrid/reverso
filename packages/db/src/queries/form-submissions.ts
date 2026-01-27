/**
 * Form submissions queries.
 */

import { and, count, desc, eq, } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import {
  type FormSubmission,
  type FormSubmissionStatus,
  type NewFormSubmission,
  formSubmissions,
} from '../schema/index.js';
import { generateId, now, parseJson, toJson } from '../utils.js';

export interface CreateFormSubmissionInput {
  formId: string;
  data: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  attachments?: string[];
}

export interface UpdateFormSubmissionInput {
  status?: FormSubmissionStatus;
  webhookSentAt?: Date;
  webhookResponse?: Record<string, unknown>;
}

export interface FormSubmissionListOptions {
  formId?: string;
  status?: FormSubmissionStatus;
  limit?: number;
  offset?: number;
}

/**
 * Create a new form submission.
 */
export async function createFormSubmission(
  db: DrizzleDatabase,
  input: CreateFormSubmissionInput
): Promise<FormSubmission> {
  const id = generateId();
  const timestamp = now();

  const newSubmission: NewFormSubmission = {
    id,
    formId: input.formId,
    data: toJson(input.data) ?? '{}',
    status: 'new',
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    referrer: input.referrer ?? null,
    attachments: toJson(input.attachments),
    webhookSentAt: null,
    webhookResponse: null,
    createdAt: timestamp,
  };

  await db.insert(formSubmissions).values(newSubmission);

  return {
    ...newSubmission,
    createdAt: timestamp,
  } as FormSubmission;
}

/**
 * Get submissions with optional filtering.
 */
export async function getFormSubmissions(
  db: DrizzleDatabase,
  options: FormSubmissionListOptions = {}
): Promise<FormSubmission[]> {
  const { formId, status, limit = 50, offset = 0 } = options;

  let query = db.select().from(formSubmissions);

  const conditions = [];
  if (formId) conditions.push(eq(formSubmissions.formId, formId));
  if (status) conditions.push(eq(formSubmissions.status, status));

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return query.orderBy(desc(formSubmissions.createdAt)).limit(limit).offset(offset);
}

/**
 * Get submissions for a specific form.
 */
export async function getFormSubmissionsByFormId(
  db: DrizzleDatabase,
  formId: string,
  options: { status?: FormSubmissionStatus; limit?: number; offset?: number } = {}
): Promise<FormSubmission[]> {
  return getFormSubmissions(db, { formId, ...options });
}

/**
 * Get a submission by ID.
 */
export async function getFormSubmissionById(
  db: DrizzleDatabase,
  id: string
): Promise<FormSubmission | undefined> {
  const result = await db.select().from(formSubmissions).where(eq(formSubmissions.id, id)).limit(1);
  return result[0];
}

/**
 * Update a submission.
 */
export async function updateFormSubmission(
  db: DrizzleDatabase,
  id: string,
  input: UpdateFormSubmissionInput
): Promise<FormSubmission | undefined> {
  const existing = await getFormSubmissionById(db, id);
  if (!existing) return undefined;

  const updates: Partial<NewFormSubmission> = {};

  if (input.status !== undefined) updates.status = input.status;
  if (input.webhookSentAt !== undefined) updates.webhookSentAt = input.webhookSentAt;
  if (input.webhookResponse !== undefined) updates.webhookResponse = toJson(input.webhookResponse);

  await db.update(formSubmissions).set(updates).where(eq(formSubmissions.id, id));

  return getFormSubmissionById(db, id);
}

/**
 * Update submission status.
 */
export async function updateFormSubmissionStatus(
  db: DrizzleDatabase,
  id: string,
  status: FormSubmissionStatus
): Promise<FormSubmission | undefined> {
  return updateFormSubmission(db, id, { status });
}

/**
 * Mark submission as read.
 */
export async function markSubmissionAsRead(
  db: DrizzleDatabase,
  id: string
): Promise<FormSubmission | undefined> {
  return updateFormSubmissionStatus(db, id, 'read');
}

/**
 * Mark submission as spam.
 */
export async function markSubmissionAsSpam(
  db: DrizzleDatabase,
  id: string
): Promise<FormSubmission | undefined> {
  return updateFormSubmissionStatus(db, id, 'spam');
}

/**
 * Archive submission.
 */
export async function archiveSubmission(
  db: DrizzleDatabase,
  id: string
): Promise<FormSubmission | undefined> {
  return updateFormSubmissionStatus(db, id, 'archived');
}

/**
 * Delete a submission.
 */
export async function deleteFormSubmission(
  db: DrizzleDatabase,
  id: string
): Promise<FormSubmission | undefined> {
  const existing = await getFormSubmissionById(db, id);
  if (!existing) return undefined;

  await db.delete(formSubmissions).where(eq(formSubmissions.id, id));
  return existing;
}

/**
 * Bulk delete submissions.
 */
export async function bulkDeleteFormSubmissions(
  db: DrizzleDatabase,
  ids: string[]
): Promise<number> {
  let deleted = 0;
  for (const id of ids) {
    const result = await deleteFormSubmission(db, id);
    if (result) deleted++;
  }
  return deleted;
}

/**
 * Get submission count for a form.
 */
export async function getFormSubmissionCount(
  db: DrizzleDatabase,
  formId: string,
  status?: FormSubmissionStatus
): Promise<number> {
  const conditions = [eq(formSubmissions.formId, formId)];
  if (status) conditions.push(eq(formSubmissions.status, status));

  const result = await db
    .select({ count: count() })
    .from(formSubmissions)
    .where(and(...conditions));

  return result[0]?.count ?? 0;
}

/**
 * Get submission stats for a form.
 */
export async function getFormSubmissionStats(
  db: DrizzleDatabase,
  formId: string
): Promise<{ total: number; new: number; read: number; spam: number; archived: number }> {
  const [total, newCount, readCount, spamCount, archivedCount] = await Promise.all([
    getFormSubmissionCount(db, formId),
    getFormSubmissionCount(db, formId, 'new'),
    getFormSubmissionCount(db, formId, 'read'),
    getFormSubmissionCount(db, formId, 'spam'),
    getFormSubmissionCount(db, formId, 'archived'),
  ]);

  return {
    total,
    new: newCount,
    read: readCount,
    spam: spamCount,
    archived: archivedCount,
  };
}

/**
 * Record webhook sent.
 */
export async function recordWebhookSent(
  db: DrizzleDatabase,
  id: string,
  response: Record<string, unknown>
): Promise<FormSubmission | undefined> {
  return updateFormSubmission(db, id, {
    webhookSentAt: now(),
    webhookResponse: response,
  });
}

// Helper functions

export function parseSubmissionData(submission: FormSubmission): Record<string, unknown> {
  return parseJson<Record<string, unknown>>(submission.data) ?? {};
}

export function parseSubmissionAttachments(submission: FormSubmission): string[] {
  return parseJson<string[]>(submission.attachments) ?? [];
}

export function parseWebhookResponse(submission: FormSubmission): Record<string, unknown> | null {
  return parseJson<Record<string, unknown>>(submission.webhookResponse);
}
