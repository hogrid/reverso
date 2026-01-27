/**
 * Route registration.
 * Registers all API routes with the Fastify server.
 */

import type { FastifyInstance } from 'fastify';
import authRoutes from './auth.js';
import contentRoutes from './content.js';
import formsRoutes from './forms.js';
import mediaRoutes from './media.js';
import pagesRoutes from './pages.js';
import redirectsRoutes from './redirects.js';
import schemaRoutes from './schema.js';
import sitemapRoutes from './sitemap.js';

/**
 * Register all API routes.
 */
export async function registerRoutes(
  server: FastifyInstance,
  prefix = '/api/reverso'
): Promise<void> {
  // Auth routes (no prefix - uses /auth/*)
  await server.register(authRoutes);

  // CMS API routes
  await server.register(
    async (instance) => {
      await instance.register(schemaRoutes);
      await instance.register(pagesRoutes);
      await instance.register(contentRoutes);
      await instance.register(mediaRoutes);
      await instance.register(formsRoutes);
      await instance.register(redirectsRoutes);
      await instance.register(sitemapRoutes);
    },
    { prefix }
  );
}

export {
  authRoutes,
  schemaRoutes,
  pagesRoutes,
  contentRoutes,
  mediaRoutes,
  formsRoutes,
  redirectsRoutes,
  sitemapRoutes,
};
