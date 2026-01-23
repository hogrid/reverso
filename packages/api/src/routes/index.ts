/**
 * Route registration.
 * Registers all API routes with the Fastify server.
 */

import type { FastifyInstance } from 'fastify';
import contentRoutes from './content.js';
import mediaRoutes from './media.js';
import pagesRoutes from './pages.js';
import schemaRoutes from './schema.js';

/**
 * Register all API routes.
 */
export async function registerRoutes(
  server: FastifyInstance,
  prefix = '/api/reverso'
): Promise<void> {
  await server.register(
    async (instance) => {
      await instance.register(schemaRoutes);
      await instance.register(pagesRoutes);
      await instance.register(contentRoutes);
      await instance.register(mediaRoutes);
    },
    { prefix }
  );
}

export { schemaRoutes, pagesRoutes, contentRoutes, mediaRoutes };
