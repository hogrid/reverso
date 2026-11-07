/**
 * Routes integration tests.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import type { ProjectSchema } from '@reverso/core';
import { createDatabaseSchema, } from '@reverso/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { databasePlugin } from '../plugins/index.js';
import { registerRoutes } from '../routes/index.js';
import { createServer, registerAuth, stopServer } from '../server.js';

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
    // These tests exercise route logic; authentication has its own suite.
    server = await createServer({
      logger: false,
      uploadsDir: TEST_UPLOADS,
      authEnabled: false,
    });

    // Register database plugin FIRST
    await server.register(databasePlugin, { url: TEST_DB });

    // Register auth AFTER database so request.db is available
    await registerAuth(server);

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

    it('POST /schema/sync keeps fields missing from the schema unless deleteRemoved is true', async () => {
      await server!.inject({ method: 'POST', url: '/api/reverso/schema/sync', payload: { schema: testSchema } });
      await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.subtitle',
        payload: { value: 'keep me' },
      });

      const smaller: ProjectSchema = {
        ...testSchema,
        pages: [
          {
            ...testSchema.pages[0]!,
            fieldCount: 1,
            sections: [{ ...testSchema.pages[0]!.sections[0]!, fields: [testSchema.pages[0]!.sections[0]!.fields[0]!] }],
          },
        ],
        totalFields: 1,
      };

      // Default: a partial scan must never delete content.
      await server!.inject({ method: 'POST', url: '/api/reverso/schema/sync', payload: { schema: smaller } });
      const kept = await server!.inject({ method: 'GET', url: '/api/reverso/content/home.hero.subtitle' });
      expect(kept.statusCode).toBe(200);
      expect(JSON.parse(kept.payload).data.value).toBe('keep me');

      // Explicit prune removes it.
      await server!.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        payload: { schema: smaller, deleteRemoved: true },
      });
      const gone = await server!.inject({ method: 'GET', url: '/api/reverso/content/home.hero.subtitle' });
      expect(gone.statusCode).toBe(404);
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

    it('PUT /content/:path publishes by default so the public API serves it', async () => {
      await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.title',
        payload: { value: 'Live' },
      });
      const pub = await server!.inject({ method: 'GET', url: '/api/reverso/public/content/home.hero.title' });
      expect(pub.statusCode).toBe(200);
      expect(JSON.parse(pub.payload).data.value).toBe('Live');

      const draft = await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/home.hero.subtitle',
        payload: { value: 'Draft', publish: false },
      });
      expect(draft.statusCode).toBe(200);
      const pubDraft = await server!.inject({ method: 'GET', url: '/api/reverso/public/content/home.hero.subtitle' });
      expect(pubDraft.statusCode).toBe(404);
    });

    it('PATCH /content/page/:slug rejects paths that belong to another page', async () => {
      const response = await server!.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/home',
        payload: { data: { 'other.hero.title': 'x' } },
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).message).toContain('other.hero.title');

      const untouched = await server!.inject({ method: 'GET', url: '/api/reverso/content/page/home' });
      expect(JSON.parse(untouched.payload).data.content).toEqual({});
    });

    it('PATCH /content/page/:slug returns 404 for a page that does not exist', async () => {
      const response = await server!.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/nonexistent',
        payload: { data: { 'nonexistent.hero.title': 'x' } },
      });
      expect(response.statusCode).toBe(404);
    });

    it('PATCH /content/page/:slug reports unknown fields instead of silently dropping them', async () => {
      const response = await server!.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/home',
        payload: { data: { 'home.hero.title': 'ok', 'home.hero.missing': 'x' } },
      });
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload).message).toContain('home.hero.missing');
    });

    it('PATCH /content/page/:slug validates the body and writes the requested locale', async () => {
      const bad = await server!.inject({ method: 'PATCH', url: '/api/reverso/content/page/home', payload: {} });
      expect(bad.statusCode).toBe(400);

      const ok = await server!.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/home?locale=pt-BR',
        payload: { data: { 'home.hero.title': 'Olá' } },
      });
      expect(ok.statusCode).toBe(200);
      expect(JSON.parse(ok.payload).data.updated).toBe(1);

      const pt = await server!.inject({ method: 'GET', url: '/api/reverso/content/page/home?locale=pt-BR' });
      expect(JSON.parse(pt.payload).data.content['home.hero.title']).toBe('Olá');
      const def = await server!.inject({ method: 'GET', url: '/api/reverso/content/page/home' });
      expect(JSON.parse(def.payload).data.content['home.hero.title']).toBeUndefined();
    });

    it('accepts the slugs and paths the scanner generates (underscores and hyphens)', async () => {
      const schema: ProjectSchema = {
        ...testSchema,
        pages: [
          {
            slug: 'about_us--v2',
            name: 'About us',
            sourceFiles: ['src/about.tsx'],
            fieldCount: 1,
            sections: [
              {
                slug: 'hero-banner',
                name: 'Hero banner',
                isRepeater: false,
                order: 0,
                fields: [
                  { path: 'about_us--v2.hero-banner.title', type: 'text', label: 'Title', file: 'src/about.tsx', line: 1, column: 1 },
                ],
              },
            ],
          },
        ],
      };
      await server!.inject({ method: 'POST', url: '/api/reverso/schema/sync', payload: { schema } });

      const put = await server!.inject({
        method: 'PUT',
        url: '/api/reverso/content/about_us--v2.hero-banner.title',
        payload: { value: 'Hi' },
      });
      expect(put.statusCode).toBe(200);
      const page = await server!.inject({ method: 'GET', url: '/api/reverso/content/page/about_us--v2' });
      expect(page.statusCode).toBe(200);
      const pub = await server!.inject({ method: 'GET', url: '/api/reverso/public/content/page/about_us--v2' });
      expect(pub.statusCode).toBe(200);
      expect(JSON.parse(pub.payload).data.content['about_us--v2.hero-banner.title']).toBe('Hi');
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
