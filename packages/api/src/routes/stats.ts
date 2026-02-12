/**
 * Stats and health routes.
 * Provides dashboard statistics and health check within the API prefix.
 */

import {
  getFieldsBySectionId,
  getMediaList,
  getPages,
  getSectionsByPageId,
} from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

const statsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /stats
   * Get dashboard statistics.
   */
  fastify.get('/stats', async (request, reply) => {
    try {
      const db = request.db;

      const pages = await getPages(db);

      let totalFields = 0;
      let pagesWithContent = 0;
      const fieldTypeCount: Record<string, number> = {};

      for (const page of pages) {
        const sections = await getSectionsByPageId(db, page.id);
        let pageHasContent = false;

        for (const section of sections) {
          const fields = await getFieldsBySectionId(db, section.id);
          totalFields += fields.length;

          for (const field of fields) {
            const fieldType = field.type || 'unknown';
            fieldTypeCount[fieldType] = (fieldTypeCount[fieldType] || 0) + 1;
            if (field.defaultValue) {
              pageHasContent = true;
            }
          }
        }

        if (pageHasContent || (page.fieldCount ?? 0) > 0) {
          pagesWithContent++;
        }
      }

      // Get media stats
      const media = await getMediaList(db, { limit: 10000 });
      let totalMediaSize = 0;
      const mediaByType: Record<string, number> = {};

      for (const m of media) {
        totalMediaSize += m.size ?? 0;
        const mimeCategory = m.mimeType?.split('/')[0] ?? 'unknown';
        mediaByType[mimeCategory] = (mediaByType[mimeCategory] || 0) + 1;
      }

      return {
        success: true,
        data: {
          pages: {
            total: pages.length,
            withContent: pagesWithContent,
          },
          fields: {
            total: totalFields,
            byType: fieldTypeCount,
          },
          media: {
            total: media.length,
            totalSize: totalMediaSize,
            byType: mediaByType,
          },
          recentActivity: [],
        },
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to get stats');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to get stats',
      });
    }
  });

  /**
   * GET /health
   * Health check endpoint within the API prefix.
   */
  fastify.get('/health', async () => ({
    success: true,
    data: {
      status: 'ok' as const,
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    },
  }));
};

export default statsRoutes;
