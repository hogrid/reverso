/**
 * Schema routes.
 * Handles schema retrieval and sync from scanner.
 */

import type { FieldSchema, PageSchema, ProjectSchema, SectionSchema } from '@reverso/core';
import {
  type Field,
  type Section,
  getFields,
  getPages,
  getSchemaStats,
  getSections,
  parseFieldConfig,
  parseRepeaterConfig,
  parseSourceFiles,
  syncSchema,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { SchemaSyncBody } from '../types.js';
import { toFieldSchema } from '../utils/field-schema.js';
import { schemaSyncSchema } from '../validation.js';

const schemaRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /schema
   * Get the current schema from the database.
   */
  fastify.get('/schema', async (request, reply) => {
    try {
      const db = request.db;

      // Load the entire tree in 3 queries (pages, sections, fields) and group
      // it in memory, instead of querying sections/fields per page/section
      // (avoids N+1).
      const [pages, allSections, allFields] = await Promise.all([
        getPages(db),
        getSections(db),
        getFields(db),
      ]);

      const sectionsByPageId = new Map<string, Section[]>();
      for (const section of allSections) {
        const list = sectionsByPageId.get(section.pageId);
        if (list) {
          list.push(section);
        } else {
          sectionsByPageId.set(section.pageId, [section]);
        }
      }

      const fieldsBySectionId = new Map<string, Field[]>();
      for (const field of allFields) {
        const list = fieldsBySectionId.get(field.sectionId);
        if (list) {
          list.push(field);
        } else {
          fieldsBySectionId.set(field.sectionId, [field]);
        }
      }

      const schemaPages: PageSchema[] = [];

      for (const page of pages) {
        const sections = sectionsByPageId.get(page.id) ?? [];
        const schemaSections: SectionSchema[] = [];

        for (const section of sections) {
          const fields = fieldsBySectionId.get(section.id) ?? [];
          const schemaFields: FieldSchema[] = fields.map(toFieldSchema);

          schemaSections.push({
            slug: section.slug,
            name: section.name,
            fields: schemaFields,
            isRepeater: section.isRepeater ?? false,
            repeaterConfig: parseRepeaterConfig(section),
            order: section.sortOrder ?? 0,
          });
        }

        schemaPages.push({
          slug: page.slug,
          name: page.name,
          sections: schemaSections,
          fieldCount: page.fieldCount ?? 0,
          sourceFiles: parseSourceFiles(page),
        });
      }

      const schema: ProjectSchema = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        pages: schemaPages,
        pageCount: schemaPages.length,
        totalFields: schemaPages.reduce((sum, p) => sum + p.fieldCount, 0),
        meta: {
          srcDir: 'src',
          filesScanned: 0,
          filesWithMarkers: 0,
          scanDuration: 0,
        },
      };

      return { success: true, data: schema };
    } catch (error) {
      fastify.log.error(error, 'Failed to get schema');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get schema',
      });
    }
  });

  /**
   * POST /schema/sync
   * Sync schema from scanner output to database.
   */
  fastify.post<{ Body: SchemaSyncBody }>('/schema/sync', {
    preHandler: fastify.requireAuth(['admin']),
  }, async (request, reply) => {
    try {
      const bodyResult = schemaSyncSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.issues[0]?.message ?? 'Invalid schema format',
        });
      }

      const { schema, deleteRemoved } = bodyResult.data;

      const result = await syncSchema(request.db, schema as ProjectSchema, {
        deleteRemoved,
        verbose: false,
      });

      return {
        success: true,
        data: result,
        message: `Synced ${schema.pages.length} pages in ${result.duration}ms`,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to sync schema');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to sync schema',
      });
    }
  });

  /**
   * GET /schema/stats
   * Get schema statistics.
   */
  fastify.get('/schema/stats', async (request, reply) => {
    try {
      const db = request.db;

      // 3 COUNT queries instead of walking every page → section → field.
      const stats = await getSchemaStats(db);

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get schema stats');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get schema stats',
      });
    }
  });
};

export default schemaRoutes;
