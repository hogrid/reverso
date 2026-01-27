/**
 * Routes integration tests.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import type { ProjectSchema } from '@reverso/core';
import { createDatabaseSchema, } from '@reverso/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { databasePlugin } from '../plugins/index.js';
import { registerRoutes } from '../routes/index.js';
import { createServer, stopServer } from '../server.js';

const TEST_DB = '.test/api.db';
const TEST_UPLOADS = '.test/uploads';

describe('API Routes', () => {
  let server: Awaited<ReturnType<typeof createServer>> | null = null;

  const testSchema: ProjectSchema = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    pages: [
      {
        slug: 'home',
        name: 'Home Page',
        sourceFiles: ['src/pages/home.tsx'],
        fieldCount: 2,
        sections: [
          {
            slug: 'hero',
            name: 'Hero Section',
            isRepeater: false,
            order: 0,
            fields: [
              {
                path: 'home.hero.title',
                type: 'text',
                label: 'Title',
                file: 'src/pages/home.tsx',
                line: 10,
                column: 5,
              },
              {
                path: 'home.hero.subtitle',
                type: 'text',
                label: 'Subtitle',
                file: 'src/pages/home.tsx',
                line: 15,
                column: 5,
              },
            ],
          },
        ],
      },
    ],
    pageCount: 1,
    totalFields: 2,
    meta: {
      srcDir: 'src',
      filesScanned: 1,
      filesWithMarkers: 1,
      scanDuration: 50,
    },
  };

  beforeEach(async () => {
    // Clean up test files
    if (existsSync(TEST_DB)) {
      rmSync(TEST_DB, { force: true });
    }
    if (!existsSync('.test')) {
      mkdirSync('.test', { recursive: true });
    }
    if (!existsSync(TEST_UPLOADS)) {
      mkdirSync(TEST_UPLOADS, { recursive: true });
    }

    // Create database
    await createDatabaseSchema(TEST_DB);

    // Create server
    server = await createServer({
      logger: false,
      uploadsDir: TEST_UPLOADS,
    });

    // Register database plugin
    await server.register(databasePlugin, { url: TEST_DB });

    // Register routes
    await registerRoutes(server);
  });

  afterEach(async () => {
    if (server) {
      await stopServer(server);
      server = null;
    }
    if (existsSync(TEST_DB)) {
      rmSync(TEST_DB, { force: true });
    }
    if (existsSync(TEST_UPLOADS)) {
      rmSync(TEST_UPLOADS, { recursive: true, force: true });
    }
  });

  describe('Schema Routes', () => {
    it('GET /schema returns empty schema initially', async () => {
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/schema',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.data.pages).toHaveLength(0);
    });

    it('POST /schema/sync syncs schema to database', async () => {
      const response = await server!.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        payload: { schema: testSchema },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.success).toBe(true);
      expect(body.message).toContain('1 pages');
    });

    it('GET /schema returns synced schema', async () => {
      // First sync
      await server!.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        payload: { schema: testSchema },
      });

      // Then get
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/schema',
      });

      const body = JSON.parse(response.payload);
      expect(body.data.pages).toHaveLength(1);
      expect(body.data.pages[0].slug).toBe('home');
    });

    it('GET /schema/stats returns statistics', async () => {
      await server!.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        payload: { schema: testSchema },
      });

      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/schema/stats',
      });

      const body = JSON.parse(response.payload);
      expect(body.data.pages).toBe(1);
      expect(body.data.fields).toBe(2);
    });
  });

  describe('Pages Routes', () => {
    beforeEach(async () => {
      await server!.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        payload: { schema: testSchema },
      });
    });

    it('GET /pages returns all pages', async () => {
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/pages',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].slug).toBe('home');
    });

    it('GET /pages/:slug returns page with sections', async () => {
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/pages/home',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.slug).toBe('home');
      expect(body.data.sections).toHaveLength(1);
      expect(body.data.sections[0].fields).toHaveLength(2);
    });

    it('GET /pages/:slug returns 404 for non-existent page', async () => {
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/pages/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Content Routes', () => {
    beforeEach(async () => {
      await server!.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        payload: { schema: testSchema },
      });
    });

    it('PUT /content/:path creates content', async () => {
      const response = await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.title',
        payload: {
          value: 'Welcome to Reverso',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.value).toBe('Welcome to Reverso');
    });

    it('GET /content/:path returns content', async () => {
      // Create content first
      await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.title',
        payload: { value: 'Test Title' },
      });

      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/content/home.hero.title',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.value).toBe('Test Title');
    });

    it('GET /content/page/:slug returns all page content', async () => {
      // Create content
      await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.title',
        payload: { value: 'Title' },
      });
      await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.subtitle',
        payload: { value: 'Subtitle' },
      });

      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/content/page/home',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.content['home.hero.title']).toBe('Title');
      expect(body.data.content['home.hero.subtitle']).toBe('Subtitle');
    });

    it('POST /content/bulk updates multiple fields', async () => {
      const response = await server!.inject({
        method: 'POST',
        url: '/api/reverso/content/bulk',
        payload: {
          updates: [
            { path: 'home.hero.title', value: 'Bulk Title' },
            { path: 'home.hero.subtitle', value: 'Bulk Subtitle' },
          ],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.updated).toBe(2);
    });
  });

  describe('Media Routes', () => {
    it('GET /media returns empty list initially', async () => {
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/media',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data).toHaveLength(0);
    });

    it('GET /media/:id returns 404 for non-existent media', async () => {
      const response = await server!.inject({
        method: 'GET',
        url: '/api/reverso/media/nonexistent',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
