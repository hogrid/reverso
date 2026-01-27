/**
 * API type definitions.
 */

import type { ContentValue, ProjectSchema } from '@reverso/core';
import type { DrizzleDatabase } from '@reverso/db';
import type { FastifyRequest } from 'fastify';
import type { AuthUser } from './plugins/auth.js';

// Re-export for convenience
export type { AuthUser };

/**
 * Extended FastifyRequest with database.
 */
export interface ApiRequest extends FastifyRequest {
  db: DrizzleDatabase;
}

/**
 * API error response.
 */
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

/**
 * API success response.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

/**
 * Schema sync request body.
 */
export interface SchemaSyncBody {
  schema: ProjectSchema;
  deleteRemoved?: boolean;
}

/**
 * Content update request body.
 */
export interface ContentUpdateBody {
  value: ContentValue;
  locale?: string;
  publish?: boolean;
}

/**
 * Bulk content update request body.
 */
export interface BulkContentUpdateBody {
  updates: Array<{
    path: string;
    value: ContentValue;
    locale?: string;
  }>;
}

/**
 * Media upload result.
 */
export interface MediaUploadResult {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
}

/**
 * Pagination params.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * List response with pagination.
 */
export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
