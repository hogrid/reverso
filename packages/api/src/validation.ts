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

export type ContentUpdateInput = z.infer<typeof contentUpdateSchema>;
export type BulkContentUpdateInput = z.infer<typeof bulkContentUpdateSchema>;
export type SchemaSyncInput = z.infer<typeof schemaSyncSchema>;
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
