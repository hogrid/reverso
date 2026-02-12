/**
 * Content routes.
 * Handles content CRUD operations.
 */

import type { ContentValue } from '@reverso/core';
import {
  bulkUpdateContent,
  getContentByPath,
  getContentByPathPrefix,
  getFieldByPath,
  parseContentValue,
  publishContent,
  unpublishContent,
  upsertContent,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { BulkContentUpdateBody, ContentUpdateBody } from '../types.js';
import {
  bulkContentUpdateSchema,
  contentUpdateSchema,
  localeQuerySchema,
  pathParamSchema,
  slugParamSchema,
} from '../validation.js';

const contentRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /content/:path
   * Get content by field path.
   * Requires: viewer, editor, or admin role
   */
  fastify.get<{
    Params: { path: string };
    Querystring: { locale?: string };
  }>('/content/:path', {
    preHandler: fastify.requireAuth(['viewer', 'editor', 'admin']),
  }, async (request, reply) => {
    try {
      const paramResult = pathParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid path format. Use dot notation (e.g., home.hero.title)',
        });
      }

      const queryResult = localeQuerySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid locale format',
        });
      }

      const { path } = paramResult.data;
      const { locale } = queryResult.data;
      const db = request.db;

      const content = await getContentByPath(db, path, locale);
      if (!content) {
        // Check if field exists
        const field = await getFieldByPath(db, path);
        if (!field) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Field "${path}" not found`,
          });
        }

        // Field exists but no content yet
        return {
          success: true,
          data: {
            path,
            locale,
            value: null,
            published: false,
          },
        };
      }

      return {
        success: true,
        data: {
          id: content.id,
          path,
          locale: content.locale,
          value: parseContentValue(content),
          published: content.published,
          publishedAt: content.publishedAt,
          updatedAt: content.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get content',
      });
    }
  });

  /**
   * PUT /content/:path
   * Update content by field path.
   * Requires: editor or admin role
   */
  fastify.put<{
    Params: { path: string };
    Body: ContentUpdateBody;
  }>('/content/:path', {
    preHandler: fastify.requireAuth(['editor', 'admin']),
  }, async (request, reply) => {
    try {
      const paramResult = pathParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid path format. Use dot notation (e.g., home.hero.title)',
        });
      }

      const bodyResult = contentUpdateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const { path } = paramResult.data;
      const { value, locale, publish } = bodyResult.data;
      const db = request.db;

      const field = await getFieldByPath(db, path);
      if (!field) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Field "${path}" not found`,
        });
      }

      // Get user ID from auth if available
      const changedBy = (request as any).user?.id;

      const content = await upsertContent(db, {
        fieldId: field.id,
        locale,
        value: value as ContentValue,
        published: publish,
        changedBy,
      });

      return {
        success: true,
        data: {
          id: content.id,
          path,
          locale: content.locale,
          value: parseContentValue(content),
          published: content.published,
          updatedAt: content.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to update content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to update content',
      });
    }
  });

  /**
   * POST /content/bulk
   * Bulk update content.
   * Requires: editor or admin role
   */
  fastify.post<{ Body: BulkContentUpdateBody }>('/content/bulk', {
    preHandler: fastify.requireAuth(['editor', 'admin']),
  }, async (request, reply) => {
    try {
      const bodyResult = bulkContentUpdateSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid request body',
        });
      }

      const { updates } = bodyResult.data;
      const db = request.db;
      const changedBy = (request as any).user?.id;

      const results = await bulkUpdateContent(
        db,
        updates.map((u) => ({
          path: u.path,
          value: u.value as ContentValue,
          locale: u.locale,
          changedBy,
        }))
      );

      return {
        success: true,
        data: {
          updated: results.length,
          items: results.map((c) => ({
            id: c.id,
            locale: c.locale,
            updatedAt: c.updatedAt,
          })),
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to bulk update content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to bulk update content',
      });
    }
  });

  /**
   * GET /content/page/:slug
   * Get all content for a page.
   * Requires: viewer, editor, or admin role
   */
  fastify.get<{
    Params: { slug: string };
    Querystring: { locale?: string };
  }>('/content/page/:slug', {
    preHandler: fastify.requireAuth(['viewer', 'editor', 'admin']),
  }, async (request, reply) => {
    try {
      const paramResult = slugParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid slug format',
        });
      }

      const queryResult = localeQuerySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid locale format',
        });
      }

      const { slug } = paramResult.data;
      const { locale } = queryResult.data;
      const db = request.db;

      const results = await getContentByPathPrefix(db, `${slug}.`, locale);

      const contentMap: Record<string, unknown> = {};
      for (const { path, content } of results) {
        contentMap[path] = parseContentValue(content);
      }

      return {
        success: true,
        data: {
          page: slug,
          locale,
          content: contentMap,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get page content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get page content',
      });
    }
  });

  /**
   * PATCH /content/page/:slug
   * Update multiple content fields for a page.
   * Requires: editor or admin role
   */
  fastify.patch<{
    Params: { slug: string };
    Body: { data: Record<string, unknown> };
  }>('/content/page/:slug', {
    preHandler: fastify.requireAuth(['editor', 'admin']),
  }, async (request, reply) => {
    try {
      const paramResult = slugParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid slug format',
        });
      }

      const { slug } = paramResult.data;
      const { data } = request.body as { data: Record<string, unknown> };
      const db = request.db;
      const changedBy = (request as any).user?.id;

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Request body must contain a "data" object',
        });
      }

      const updates = Object.entries(data).map(([path, value]) => ({
        path,
        value: value as ContentValue,
        changedBy,
      }));

      const results = await bulkUpdateContent(db, updates);

      return {
        success: true,
        data: {
          page: slug,
          updated: results.length,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to update page content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to update page content',
      });
    }
  });

  /**
   * POST /content/:path/publish
   * Publish content.
   * Requires: editor or admin role
   */
  fastify.post<{ Params: { path: string } }>('/content/:path/publish', {
    preHandler: fastify.requireAuth(['editor', 'admin']),
  }, async (request, reply) => {
    try {
      const paramResult = pathParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid path format',
        });
      }

      const { path } = paramResult.data;
      const db = request.db;

      const content = await getContentByPath(db, path);
      if (!content) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Content for "${path}" not found`,
        });
      }

      const published = await publishContent(db, content.id);

      return {
        success: true,
        data: {
          id: published?.id,
          path,
          published: published?.published,
          publishedAt: published?.publishedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to publish content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to publish content',
      });
    }
  });

  /**
   * POST /content/:path/unpublish
   * Unpublish content.
   * Requires: editor or admin role
   */
  fastify.post<{ Params: { path: string } }>('/content/:path/unpublish', {
    preHandler: fastify.requireAuth(['editor', 'admin']),
  }, async (request, reply) => {
    try {
      const paramResult = pathParamSchema.safeParse(request.params);
      if (!paramResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: 'Invalid path format',
        });
      }

      const { path } = paramResult.data;
      const db = request.db;

      const content = await getContentByPath(db, path);
      if (!content) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Content for "${path}" not found`,
        });
      }

      const unpublished = await unpublishContent(db, content.id);

      return {
        success: true,
        data: {
          id: unpublished?.id,
          path,
          published: unpublished?.published,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to unpublish content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to unpublish content',
      });
    }
  });
};

export default contentRoutes;
