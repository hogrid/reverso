/**
 * Sitemap route.
 * Generates dynamic XML sitemap for SEO.
 */

import { getFormsByStatus, getPages } from '@reverso/db';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Build XML sitemap from URLs.
 */
function buildSitemapXml(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map((url) => {
      const parts = [`    <url>`, `      <loc>${escapeXml(url.loc)}</loc>`];

      if (url.lastmod) {
        parts.push(`      <lastmod>${url.lastmod}</lastmod>`);
      }

      if (url.changefreq) {
        parts.push(`      <changefreq>${url.changefreq}</changefreq>`);
      }

      if (url.priority !== undefined) {
        parts.push(`      <priority>${url.priority.toFixed(1)}</priority>`);
      }

      parts.push(`    </url>`);
      return parts.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Escape special XML characters.
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date for sitemap (ISO 8601 date format).
 */
function formatDate(date: string | Date | null): string | undefined {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

// Cache for sitemap (1 hour)
let sitemapCache: { xml: string; timestamp: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const sitemapRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  /**
   * GET /sitemap.xml
   * Generate dynamic sitemap.
   */
  fastify.get('/sitemap.xml', async (request, reply) => {
    try {
      // Check cache
      const now = Date.now();
      if (sitemapCache && now - sitemapCache.timestamp < CACHE_TTL) {
        reply.header('Content-Type', 'application/xml');
        reply.header('Cache-Control', 'public, max-age=3600');
        return sitemapCache.xml;
      }

      const db = request.db;

      // Get base URL from request or config
      const protocol = request.protocol || 'https';
      const host = request.hostname || 'localhost';
      const baseUrl = `${protocol}://${host}`;

      const urls: SitemapUrl[] = [];

      // Add homepage
      urls.push({
        loc: baseUrl,
        changefreq: 'daily',
        priority: 1.0,
      });

      // Get all pages
      const pages = await getPages(db);
      for (const page of pages) {
        // Skip home page (already added)
        if (page.slug === 'home' || page.slug === 'index') {
          continue;
        }

        urls.push({
          loc: `${baseUrl}/${page.slug}`,
          lastmod: formatDate(page.updatedAt),
          changefreq: 'weekly',
          priority: 0.8,
        });
      }

      // Get published forms (for public form pages)
      const publishedForms = await getFormsByStatus(db, 'published');
      for (const form of publishedForms) {
        urls.push({
          loc: `${baseUrl}/forms/${form.slug}`,
          lastmod: formatDate(form.updatedAt),
          changefreq: 'monthly',
          priority: 0.6,
        });
      }

      // Build XML
      const xml = buildSitemapXml(urls);

      // Update cache
      sitemapCache = { xml, timestamp: now };

      reply.header('Content-Type', 'application/xml');
      reply.header('Cache-Control', 'public, max-age=3600');
      return xml;
    } catch (error) {
      fastify.log.error(error, 'Failed to generate sitemap');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to generate sitemap',
      });
    }
  });

  /**
   * POST /sitemap/invalidate
   * Invalidate sitemap cache (admin only).
   */
  fastify.post('/sitemap/invalidate', async (request, reply) => {
    try {
      sitemapCache = null;

      return {
        success: true,
        message: 'Sitemap cache invalidated',
      };
    } catch (error) {
      fastify.log.error(error, 'Failed to invalidate sitemap cache');
      return reply.status(500).send({
        success: false,
        error: 'Internal error',
        message: 'Failed to invalidate sitemap cache',
      });
    }
  });
};

export default sitemapRoutes;
