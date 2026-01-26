/**
 * Redirects routes.
 * Handles redirect CRUD operations for SEO.
 */

import {
  bulkCreateRedirects,
  createRedirect,
  deleteRedirect,
  disableRedirect,
  enableRedirect,
  getEnabledRedirects,
  getRedirectByFromPath,
  getRedirectById,
  getRedirectStats,
  getRedirects,
  recordRedirectHit,
  updateRedirect,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { idParamSchema, paginationSchema, redirectCreateSchema, redirectUpdateSchema } from '../validation.js';

const redirectsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /redirects
   * List all redirects.
   */
  fastify.get<{ Querystring: { limit?: string; offset?: string; enabled?: string } }>(
    '/redirects',
    async (request, reply) => {
      try {
        const queryResult = paginationSchema.safeParse(request.query);
        const { limit, offset } = queryResult.success ? queryResult.data : {};
        const isEnabled = request.query.enabled === 'true' ? true : request.query.enabled === 'false' ? false : undefined;

        const db = request.db;
        const redirects = await getRedirects(db, { isEnabled, limit, offset });
        const stats = await getRedirectStats(db);

        return {
          success: true,
          data: redirects.map((r) => ({
            id: r.id,
            fromPath: r.fromPath,
            toPath: r.toPath,
            statusCode: r.statusCode,
            isEnabled: r.isEnabled,
            hitCount: r.hitCount,
            lastHitAt: r.lastHitAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          })),
          meta: {
            total: stats.total,
            enabled: stats.enabled,
            disabled: stats.disabled,
            totalHits: stats.totalHits,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to list redirects');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to list redirects',
        });
      }
    }
  );

  /**
   * POST /redirects
   * Create a new redirect.
   */
  fastify.post('/redirects', async (request, reply) => {
    try {
      const bodyResult = redirectCreateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const db = request.db;
      const input = bodyResult.data;

      // Check if fromPath already exists
      const existing = await getRedirectByFromPath(db, input.fromPath);
      if (existing) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: `Redirect from "${input.fromPath}" already exists`,
        });
      }

      const redirect = await createRedirect(db, input);

      return {
        success: true,
        data: {
          id: redirect.id,
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
          isEnabled: redirect.isEnabled,
          createdAt: redirect.createdAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to create redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to create redirect',
      });
    }
  });

  /**
   * GET /redirects/:id
   * Get a redirect by ID.
   */
  fastify.get<{ Params: { id: string } }>('/redirects/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const redirect = await getRedirectById(db, id);
      if (!redirect) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Redirect with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: redirect.id,
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
          isEnabled: redirect.isEnabled,
          hitCount: redirect.hitCount,
          lastHitAt: redirect.lastHitAt,
          createdAt: redirect.createdAt,
          updatedAt: redirect.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get redirect',
      });
    }
  });

  /**
   * PUT /redirects/:id
   * Update a redirect.
   */
  fastify.put<{ Params: { id: string } }>('/redirects/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const bodyResult = redirectUpdateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      // If fromPath is being changed, check for duplicates
      if (bodyResult.data.fromPath) {
        const existing = await getRedirectByFromPath(db, bodyResult.data.fromPath);
        if (existing && existing.id !== id) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: `Redirect from "${bodyResult.data.fromPath}" already exists`,
          });
        }
      }

      const redirect = await updateRedirect(db, id, bodyResult.data);
      if (!redirect) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Redirect with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: redirect.id,
          fromPath: redirect.fromPath,
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
          isEnabled: redirect.isEnabled,
          updatedAt: redirect.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to update redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to update redirect',
      });
    }
  });

  /**
   * DELETE /redirects/:id
   * Delete a redirect.
   */
  fastify.delete<{ Params: { id: string } }>('/redirects/:id', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const redirect = await deleteRedirect(db, id);
      if (!redirect) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Redirect with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: { id: redirect.id, deleted: true },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to delete redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to delete redirect',
      });
    }
  });

  /**
   * PUT /redirects/:id/enable
   * Enable a redirect.
   */
  fastify.put<{ Params: { id: string } }>('/redirects/:id/enable', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const redirect = await enableRedirect(db, id);
      if (!redirect) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Redirect with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: redirect.id,
          isEnabled: redirect.isEnabled,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to enable redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to enable redirect',
      });
    }
  });

  /**
   * PUT /redirects/:id/disable
   * Disable a redirect.
   */
  fastify.put<{ Params: { id: string } }>('/redirects/:id/disable', async (request, reply) => {
    try {
      const paramResult = idParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid ID format',
        });
      }

      const db = request.db;
      const { id } = paramResult.data;

      const redirect = await disableRedirect(db, id);
      if (!redirect) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Redirect with ID "${id}" not found`,
        });
      }

      return {
        success: true,
        data: {
          id: redirect.id,
          isEnabled: redirect.isEnabled,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to disable redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to disable redirect',
      });
    }
  });

  /**
   * POST /redirects/bulk-import
   * Bulk import redirects from CSV.
   */
  fastify.post<{ Body: { redirects: Array<{ fromPath: string; toPath: string; statusCode?: number }> } }>(
    '/redirects/bulk-import',
    async (request, reply) => {
      try {
        const { redirects: inputs } = request.body as {
          redirects: Array<{ fromPath: string; toPath: string; statusCode?: number }>;
        };

        if (!Array.isArray(inputs) || inputs.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'redirects must be a non-empty array',
          });
        }

        // Validate each redirect
        const validInputs: Array<{ fromPath: string; toPath: string; statusCode?: 301 | 302 | 307 | 308 }> = [];
        for (const input of inputs) {
          if (!input.fromPath || !input.toPath) continue;
          if (input.statusCode && ![301, 302, 307, 308].includes(input.statusCode)) continue;
          validInputs.push({
            fromPath: input.fromPath,
            toPath: input.toPath,
            statusCode: input.statusCode as 301 | 302 | 307 | 308 | undefined,
          });
        }

        const db = request.db;
        const result = await bulkCreateRedirects(db, validInputs);

        return {
          success: true,
          data: {
            created: result.created,
            skipped: result.skipped,
            errors: result.errors,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to bulk import redirects');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to bulk import redirects',
        });
      }
    }
  );

  /**
   * GET /redirects/export
   * Export redirects as CSV.
   */
  fastify.get('/redirects/export', async (request, reply) => {
    try {
      const db = request.db;
      const redirects = await getRedirects(db, { limit: 10000 });

      // Build CSV
      const headers = ['From Path', 'To Path', 'Status Code', 'Enabled', 'Hit Count', 'Last Hit', 'Created At'];
      const rows = redirects.map((r) => [
        r.fromPath,
        r.toPath,
        String(r.statusCode),
        r.isEnabled ? 'true' : 'false',
        String(r.hitCount ?? 0),
        r.lastHitAt?.toISOString() ?? '',
        r.createdAt?.toISOString() ?? '',
      ]);

      const csv = [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n');

      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', 'attachment; filename="redirects.csv"');
      return csv;
    } catch (error) {
      fastify.log.error(error, 'Failed to export redirects');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to export redirects',
      });
    }
  });

  /**
   * GET /redirect
   * Resolve a redirect (for middleware use).
   */
  fastify.get<{ Querystring: { path: string } }>('/redirect', async (request, reply) => {
    try {
      const { path } = request.query as { path: string };
      if (!path) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'path query parameter is required',
        });
      }

      const db = request.db;
      const redirect = await getRedirectByFromPath(db, path);

      if (!redirect || !redirect.isEnabled) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: 'No redirect found for this path',
        });
      }

      // Record the hit
      await recordRedirectHit(db, redirect.id);

      return {
        success: true,
        data: {
          toPath: redirect.toPath,
          statusCode: redirect.statusCode,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to resolve redirect');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to resolve redirect',
      });
    }
  });
};

/**
 * Escape a value for CSV.
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default redirectsRoutes;
