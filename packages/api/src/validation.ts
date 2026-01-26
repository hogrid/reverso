/**
 * Input validation schemas using Zod.
 */

import { z } from 'zod';

/**
 * Allowed MIME types for file uploads.
 */
export const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Videos
  'video/mp4',
  'video/webm',
  'video/ogg',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
]);

/**
 * Max file size (50MB).
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Slug validation regex.
 * Allows lowercase letters, numbers, and hyphens.
 */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Path validation regex.
 * Allows alphanumeric, dots, underscores, and $ for repeaters.
 */
export const PATH_REGEX = /^[a-zA-Z0-9_$.]+(?:\.[a-zA-Z0-9_$.]+)*$/;

/**
 * Locale validation regex.
 * Allows standard locale codes like "en", "en-US", "pt-BR".
 */
export const LOCALE_REGEX = /^[a-z]{2}(?:-[A-Z]{2})?$|^default$/;

/**
 * Sanitize filename to prevent path traversal attacks.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and null bytes
  let sanitized = filename.replace(/[/\\]/g, '').replace(/\0/g, '').replace(/\.\./g, '');

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.slice(sanitized.lastIndexOf('.'));
    const name = sanitized.slice(0, sanitized.lastIndexOf('.'));
    sanitized = name.slice(0, 255 - ext.length) + ext;
  }

  return sanitized || 'unnamed';
}

/**
 * Check if MIME type is allowed.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

/**
 * Content update body schema.
 */
export const contentUpdateSchema = z.object({
  value: z.unknown(),
  locale: z.string().regex(LOCALE_REGEX, 'Invalid locale format').optional().default('default'),
  publish: z.boolean().optional(),
});

/**
 * Bulk content update schema.
 */
export const bulkContentUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        path: z.string().regex(PATH_REGEX, 'Invalid path format').min(1),
        value: z.unknown(),
        locale: z.string().regex(LOCALE_REGEX).optional(),
      })
    )
    .min(1, 'At least one update required'),
});

/**
 * Schema sync body schema.
 */
export const schemaSyncSchema = z.object({
  schema: z.object({
    version: z.string(),
    generatedAt: z.string(),
    pages: z.array(
      z.object({
        slug: z.string().min(1),
        name: z.string().min(1),
        sections: z.array(z.any()),
        fieldCount: z.number().int().min(0),
        sourceFiles: z.array(z.string()),
      })
    ),
    pageCount: z.number().int().min(0),
    totalFields: z.number().int().min(0),
    meta: z.object({
      srcDir: z.string(),
      filesScanned: z.number().int().min(0),
      filesWithMarkers: z.number().int().min(0),
      scanDuration: z.number().min(0),
    }),
  }),
  deleteRemoved: z.boolean().optional().default(true),
});

/**
 * Media metadata update schema.
 */
export const mediaUpdateSchema = z.object({
  alt: z.string().max(500).optional(),
  caption: z.string().max(2000).optional(),
});

/**
 * Pagination query schema.
 */
export const paginationSchema = z.object({
  limit: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100))
    .optional(),
  offset: z
    .string()
    .transform((val) => Number.parseInt(val, 10))
    .pipe(z.number().int().min(0))
    .optional(),
});

/**
 * Media list query schema.
 */
export const mediaListQuerySchema = paginationSchema.extend({
  type: z.string().optional(),
});

/**
 * Path param schema.
 */
export const pathParamSchema = z.object({
  path: z.string().regex(PATH_REGEX, 'Invalid path format').min(1),
});

/**
 * Slug param schema.
 */
export const slugParamSchema = z.object({
  slug: z.string().regex(SLUG_REGEX, 'Invalid slug format').min(1),
});

/**
 * ID param schema.
 */
export const idParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Locale query schema.
 */
export const localeQuerySchema = z.object({
  locale: z.string().regex(LOCALE_REGEX).optional().default('default'),
});

// ============================================
// FORMS VALIDATION
// ============================================

/**
 * Form status enum.
 */
export const formStatusSchema = z.enum(['draft', 'published', 'archived']);

/**
 * Form step schema.
 */
export const formStepSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

/**
 * Form settings schema.
 */
export const formSettingsSchema = z.object({
  submitButtonText: z.string().max(100).optional(),
  successMessage: z.string().max(1000).optional(),
  redirectUrl: z.string().url().optional(),
});

/**
 * Form create schema.
 */
export const formCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().regex(SLUG_REGEX, 'Invalid slug format').min(1).max(100),
  description: z.string().max(1000).optional(),
  status: formStatusSchema.optional(),
  isMultiStep: z.boolean().optional(),
  steps: z.array(formStepSchema).optional(),
  settings: formSettingsSchema.optional(),
  notifyEmails: z.array(z.string().email()).optional(),
  notifyOnSubmission: z.boolean().optional(),
  webhookUrl: z.string().url().optional(),
  webhookSecret: z.string().max(500).optional(),
  webhookEnabled: z.boolean().optional(),
  honeypotEnabled: z.boolean().optional(),
  rateLimitPerMinute: z.number().int().min(1).max(1000).optional(),
});

/**
 * Form update schema.
 */
export const formUpdateSchema = formCreateSchema.partial();

/**
 * Form field type enum.
 */
export const formFieldTypeSchema = z.enum([
  'text',
  'email',
  'textarea',
  'number',
  'select',
  'checkbox',
  'radio',
  'date',
  'file',
  'hidden',
]);

/**
 * Field condition schema.
 */
export const fieldConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'notEquals', 'contains', 'notContains', 'isEmpty', 'isNotEmpty']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});

/**
 * Field config schema.
 */
export const fieldConfigSchema = z.object({
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  accept: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  pattern: z.string().optional(),
  rows: z.number().int().min(1).optional(),
  multiple: z.boolean().optional(),
});

/**
 * Form field create schema.
 */
export const formFieldCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: formFieldTypeSchema,
  label: z.string().max(200).optional(),
  placeholder: z.string().max(500).optional(),
  help: z.string().max(500).optional(),
  required: z.boolean().optional(),
  validation: z.string().max(2000).optional(),
  config: fieldConfigSchema.optional(),
  width: z.number().int().min(1).max(12).optional(),
  step: z.number().int().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
  condition: fieldConditionSchema.optional(),
});

/**
 * Form field update schema.
 */
export const formFieldUpdateSchema = formFieldCreateSchema.partial();

/**
 * Form submission create schema (public).
 */
export const formSubmissionCreateSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  honeypot: z.string().optional(),
});

// ============================================
// REDIRECTS VALIDATION
// ============================================

/**
 * Redirect status code enum.
 */
export const redirectStatusCodeSchema = z.union([
  z.literal(301),
  z.literal(302),
  z.literal(307),
  z.literal(308),
]);

/**
 * Redirect create schema.
 */
export const redirectCreateSchema = z.object({
  fromPath: z.string().min(1).max(2000).refine((val) => val.startsWith('/'), {
    message: 'fromPath must start with /',
  }),
  toPath: z.string().min(1).max(2000),
  statusCode: redirectStatusCodeSchema.optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * Redirect update schema.
 */
export const redirectUpdateSchema = redirectCreateSchema.partial();

// ============================================
// TYPE EXPORTS
// ============================================

export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;
export type BulkContentUpdateInput = z.infer<typeof bulkContentUpdateSchema>;
export type SchemaSyncInput = z.infer<typeof schemaSyncSchema>;
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
export type FormCreateInput = z.infer<typeof formCreateSchema>;
export type FormUpdateInput = z.infer<typeof formUpdateSchema>;
export type FormFieldCreateInput = z.infer<typeof formFieldCreateSchema>;
export type FormFieldUpdateInput = z.infer<typeof formFieldUpdateSchema>;
export type FormSubmissionCreateInput = z.infer<typeof formSubmissionCreateSchema>;
export type RedirectCreateInput = z.infer<typeof redirectCreateSchema>;
export type RedirectUpdateInput = z.infer<typeof redirectUpdateSchema>;
