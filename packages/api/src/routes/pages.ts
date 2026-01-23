/**
 * Pages routes.
 * Handles page CRUD operations.
 */

import {
  getContentByFieldId,
  getFieldsBySectionId,
  getPageBySlug,
  getPages,
  getSectionsByPageId,
  parseContentValue,
  parseFieldConfig,
  parseRepeaterConfig,
  parseSourceFiles,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { slugParamSchema } from '../validation.js';

const pagesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /pages
   * List all pages.
   */
  fastify.get('/pages', async (request, reply) => {
    try {
      const db = request.db;
      const pages = await getPages(db);

      return {
        success: true,
        data: pages.map((page) => ({
          slug: page.slug,
          name: page.name,
          fieldCount: page.fieldCount,
          sourceFiles: parseSourceFiles(page),
          createdAt: page.createdAt,
          updatedAt: page.updatedAt,
        })),
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to list pages');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to list pages',
      });
    }
  });

  /**
   * GET /pages/:slug
   * Get a page with its sections and fields.
   */
  fastify.get<{ Params: { slug: string } }>('/pages/:slug', async (request, reply) => {
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
      const db = request.db;

      const page = await getPageBySlug(db, slug);
      if (!page) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Page "${slug}" not found`,
        });
      }

      const sections = await getSectionsByPageId(db, page.id);
      const sectionsData = [];

      for (const section of sections) {
        const fields = await getFieldsBySectionId(db, section.id);
        const fieldsData = [];

        for (const field of fields) {
          const content = await getContentByFieldId(db, field.id);

          fieldsData.push({
            path: field.path,
            type: field.type,
            label: field.label,
            placeholder: field.placeholder,
            required: field.required,
            config: parseFieldConfig(field),
            value: content ? parseContentValue(content) : null,
            published: content?.published ?? false,
          });
        }

        sectionsData.push({
          slug: section.slug,
          name: section.name,
          isRepeater: section.isRepeater,
          repeaterConfig: parseRepeaterConfig(section),
          fields: fieldsData,
        });
      }

      return {
        success: true,
        data: {
          slug: page.slug,
          name: page.name,
          fieldCount: page.fieldCount,
          sourceFiles: parseSourceFiles(page),
          sections: sectionsData,
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get page');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get page',
      });
    }
  });

  /**
   * GET /pages/:slug/sections
   * Get sections for a page.
   */
  fastify.get<{ Params: { slug: string } }>('/pages/:slug/sections', async (request, reply) => {
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
      const db = request.db;

      const page = await getPageBySlug(db, slug);
      if (!page) {
        return reply.status(404).send({
          success: false,
          error: 'Not found',
          message: `Page "${slug}" not found`,
        });
      }

      const sections = await getSectionsByPageId(db, page.id);

      return {
        success: true,
        data: sections.map((section) => ({
          slug: section.slug,
          name: section.name,
          isRepeater: section.isRepeater,
          repeaterConfig: parseRepeaterConfig(section),
          sortOrder: section.sortOrder,
        })),
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get sections');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get sections',
      });
    }
  });

  /**
   * GET /pages/:slug/sections/:sectionSlug
   * Get a specific section with fields.
   */
  fastify.get<{ Params: { slug: string; sectionSlug: string } }>(
    '/pages/:slug/sections/:sectionSlug',
    async (request, reply) => {
      try {
        const { slug, sectionSlug } = request.params;
        const db = request.db;

        // Validate slug format
        const paramResult = slugParamSchema.safeParse({ slug });
        if (!paramResult.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation error',
            message: 'Invalid slug format',
          });
        }

        const page = await getPageBySlug(db, slug);
        if (!page) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Page "${slug}" not found`,
          });
        }

        const sections = await getSectionsByPageId(db, page.id);
        const section = sections.find((s) => s.slug === sectionSlug);

        if (!section) {
          return reply.status(404).send({
            success: false,
            error: 'Not found',
            message: `Section "${sectionSlug}" not found in page "${slug}"`,
          });
        }

        const fields = await getFieldsBySectionId(db, section.id);
        const fieldsData = [];

        for (const field of fields) {
          const content = await getContentByFieldId(db, field.id);

          fieldsData.push({
            path: field.path,
            type: field.type,
            label: field.label,
            value: content ? parseContentValue(content) : null,
            published: content?.published ?? false,
          });
        }

        return {
          success: true,
          data: {
            slug: section.slug,
            name: section.name,
            isRepeater: section.isRepeater,
            repeaterConfig: parseRepeaterConfig(section),
            fields: fieldsData,
          },
        };
      } catch (error) {
        fastify.log.error(error, 'Failed to get section');
        return reply.status(500).send({
          success: false,
          error: 'Internal error',
          message: 'Failed to get section',
        });
      }
    }
  );
};

export default pagesRoutes;
