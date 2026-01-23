/**
 * Schema routes.
 * Handles schema retrieval and sync from scanner.
 */

import type { FieldSchema, PageSchema, ProjectSchema, SectionSchema } from '@reverso/core';
import {
  getFieldsBySectionId,
  getPages,
  getSectionsByPageId,
  parseFieldConfig,
  parseRepeaterConfig,
  parseSourceFiles,
  syncSchema,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import type { SchemaSyncBody } from '../types.js';
import { schemaSyncSchema } from '../validation.js';

const schemaRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /schema
   * Get the current schema from the database.
   */
  fastify.get('/schema', async (request, reply) => {
    try {
      const db = request.db;

      const pages = await getPages(db);
      const schemaPages: PageSchema[] = [];

      for (const page of pages) {
        const sections = await getSectionsByPageId(db, page.id);
        const schemaSections: SectionSchema[] = [];

        for (const section of sections) {
          const fields = await getFieldsBySectionId(db, section.id);
          const schemaFields: FieldSchema[] = fields.map((field) => ({
            path: field.path,
            type: field.type as FieldSchema['type'],
            label: field.label ?? undefined,
            placeholder: field.placeholder ?? undefined,
            required: field.required ?? undefined,
            validation: field.validation ?? undefined,
            options: field.options ?? undefined,
            condition: field.condition ?? undefined,
            file: field.sourceFile ?? '',
            line: field.sourceLine ?? 0,
            column: field.sourceColumn ?? 0,
            defaultContent: field.defaultValue ?? undefined,
            help: field.help ?? undefined,
            ...parseFieldConfig(field),
          }));

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
  fastify.post<{ Body: SchemaSyncBody }>('/schema/sync', async (request, reply) => {
    try {
      const bodyResult = schemaSyncSchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation error',
          message: bodyResult.error.errors[0]?.message ?? 'Invalid schema format',
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
      const pages = await getPages(db);

      let totalSections = 0;
      let totalFields = 0;

      for (const page of pages) {
        const sections = await getSectionsByPageId(db, page.id);
        totalSections += sections.length;

        for (const section of sections) {
          const fields = await getFieldsBySectionId(db, section.id);
          totalFields += fields.length;
        }
      }

      return {
        success: true,
        data: {
          pages: pages.length,
          sections: totalSections,
          fields: totalFields,
        },
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
