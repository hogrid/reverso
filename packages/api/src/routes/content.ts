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
  getPageBySlug,
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


interface PageContentRow {
  path: string;
  content: { published: boolean | null } & Parameters<typeof parseContentValue>[0];
}

/**
 * Build the page content payload from content rows:
 * - `content`: flat map of full path → value
 * - `data`: nested map data[section][fieldKey] consumed by the admin editor
 *   (fieldKey is the path without the `page.section.` prefix; repeater
 *   containers use the `$` key).
 */
function buildPageContent(
  results: PageContentRow[],
  options: { publishedOnly?: boolean } = {}
): { content: Record<string, unknown>; data: Record<string, Record<string, unknown>> } {
  const content: Record<string, unknown> = {};
  const data: Record<string, Record<string, unknown>> = {};

  for (const { path, content: row } of results) {
    if (options.publishedOnly && !row.published) continue;
    const value = parseContentValue(row);
    content[path] = value;

    const parts = path.split('.');
    const section = parts[1];
    const fieldKey = parts.slice(2).join('.');
    if (section && fieldKey) {
      data[section] ??= {};
      data[section][fieldKey] = value;
    }
  }

  return { content, data };
}

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
      const changedBy = request.user?.id;

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
      const changedBy = request.user?.id;

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
      const { content: contentMap, data } = buildPageContent(results);

      return {
        success: true,
        data: {
          page: slug,
          slug,
          locale,
          data,
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
      const changedBy = request.user?.id;

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
   * GET /public/content/page/:slug
   * Public (unauthenticated) read of all PUBLISHED content for a page.
   * This is the endpoint frontends use to render CMS-managed content.
   */
  fastify.get<{
    Params: { slug: string };
    Querystring: { locale?: string };
  }>('/public/content/page/:slug', async (request, reply) => {
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

      const page = await getPageBySlug(db, slug);
      if (!page) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Page "${slug}" not found`,
        });
      }

      const results = await getContentByPathPrefix(db, `${slug}.`, locale);
      const { content: contentMap, data } = buildPageContent(results, { publishedOnly: true });

      // Let CDNs/proxies cache briefly; browsers/SDK revalidate every time.
      reply.header('Cache-Control', 'public, max-age=0, s-maxage=10, stale-while-revalidate=30');
      return {
        success: true,
        data: {
          page: slug,
          slug,
          locale,
          data,
          content: contentMap,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get public page content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get page content',
      });
    }
  });

  /**
   * GET /public/content/:path
   * Public (unauthenticated) read of a single PUBLISHED content value.
   */
  fastify.get<{
    Params: { path: string };
    Querystring: { locale?: string };
  }>('/public/content/:path', async (request, reply) => {
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
      if (!content || !content.published) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Published content for "${path}" not found`,
        });
      }

      return {
        success: true,
        data: {
          path,
          locale: content.locale,
          value: parseContentValue(content),
          publishedAt: content.publishedAt,
          updatedAt: content.updatedAt,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get public content');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get content',
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
