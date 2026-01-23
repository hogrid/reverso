/**
 * Schema sync tests.
 */

import { existsSync, rmSync } from 'node:fs';
import type { ProjectSchema } from '@reverso/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, initDatabase, resetDatabaseInstance } from '../connection.js';
import { createDatabase } from '../migrate.js';
import { getFieldsBySectionId } from '../queries/fields.js';
import { getPages } from '../queries/pages.js';
import { getSectionsByPageId } from '../queries/sections.js';
import { syncSchema } from '../services/schema-sync.js';

const TEST_DB = '.test/schema-sync.db';

describe('Schema Sync', () => {
  beforeEach(async () => {
    resetDatabaseInstance();
    if (existsSync(TEST_DB)) {
      rmSync(TEST_DB, { force: true });
    }
    await createDatabase(TEST_DB);
    initDatabase({ url: TEST_DB });
  });

  afterEach(() => {
    closeDatabase();
    if (existsSync(TEST_DB)) {
      rmSync(TEST_DB, { force: true });
    }
  });

  const createTestSchema = (): ProjectSchema => ({
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
                path: 'home.hero.description',
                type: 'textarea',
                label: 'Description',
                file: 'src/pages/home.tsx',
                line: 15,
                column: 5,
              },
            ],
          },
        ],
      },
      {
        slug: 'about',
        name: 'About Page',
        sourceFiles: ['src/pages/about.tsx'],
        fieldCount: 1,
        sections: [
          {
            slug: 'intro',
            name: 'Intro Section',
            isRepeater: false,
            order: 0,
            fields: [
              {
                path: 'about.intro.text',
                type: 'wysiwyg',
                label: 'Content',
                file: 'src/pages/about.tsx',
                line: 5,
                column: 3,
              },
            ],
          },
        ],
      },
    ],
    pageCount: 2,
    totalFields: 3,
    meta: {
      srcDir: 'src',
      filesScanned: 10,
      filesWithMarkers: 2,
      scanDuration: 100,
    },
  });

  describe('syncSchema', () => {
    it('syncs pages from schema', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const schema = createTestSchema();

      const result = await syncSchema(db, schema);

      const pages = await getPages(db);
      expect(pages).toHaveLength(2);
      expect(pages.map((p) => p.slug)).toContain('home');
      expect(pages.map((p) => p.slug)).toContain('about');
    });

    it('syncs sections from schema', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const schema = createTestSchema();

      await syncSchema(db, schema);

      const pages = await getPages(db);
      const homePage = pages.find((p) => p.slug === 'home')!;
      const sections = await getSectionsByPageId(db, homePage.id);

      expect(sections).toHaveLength(1);
      expect(sections[0]?.slug).toBe('hero');
      expect(sections[0]?.name).toBe('Hero Section');
    });

    it('syncs fields from schema', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const schema = createTestSchema();

      await syncSchema(db, schema);

      const pages = await getPages(db);
      const homePage = pages.find((p) => p.slug === 'home')!;
      const sections = await getSectionsByPageId(db, homePage.id);
      const fields = await getFieldsBySectionId(db, sections[0]!.id);

      expect(fields).toHaveLength(2);
      expect(fields.map((f) => f.path)).toContain('home.hero.title');
      expect(fields.map((f) => f.path)).toContain('home.hero.description');
    });

    it('returns sync statistics', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const schema = createTestSchema();

      const result = await syncSchema(db, schema);

      expect(result.duration).toBeGreaterThan(0);
    });

    it('updates existing entries on re-sync', async () => {
      const db = initDatabase({ url: TEST_DB }).db;

      // First sync
      const schema1 = createTestSchema();
      await syncSchema(db, schema1);

      // Modify schema
      const schema2 = createTestSchema();
      schema2.pages[0]!.name = 'Updated Home Page';
      schema2.pages[0]!.sections[0]!.fields[0]!.label = 'Updated Title';

      // Second sync
      await syncSchema(db, schema2);

      const pages = await getPages(db);
      const homePage = pages.find((p) => p.slug === 'home')!;
      expect(homePage.name).toBe('Updated Home Page');
    });

    it('deletes removed items when deleteRemoved is true', async () => {
      const db = initDatabase({ url: TEST_DB }).db;

      // First sync with 2 pages
      const schema1 = createTestSchema();
      await syncSchema(db, schema1);

      // Remove about page
      const schema2 = createTestSchema();
      schema2.pages = schema2.pages.filter((p) => p.slug !== 'about');
      schema2.pageCount = 1;

      // Second sync with deleteRemoved
      await syncSchema(db, schema2, { deleteRemoved: true });

      const pages = await getPages(db);
      expect(pages).toHaveLength(1);
      expect(pages[0]?.slug).toBe('home');
    });

    it('keeps removed items when deleteRemoved is false', async () => {
      const db = initDatabase({ url: TEST_DB }).db;

      // First sync with 2 pages
      const schema1 = createTestSchema();
      await syncSchema(db, schema1);

      // Remove about page from schema
      const schema2 = createTestSchema();
      schema2.pages = schema2.pages.filter((p) => p.slug !== 'about');

      // Second sync without deleteRemoved
      await syncSchema(db, schema2, { deleteRemoved: false });

      const pages = await getPages(db);
      expect(pages).toHaveLength(2);
    });
  });

  describe('repeater sections', () => {
    it('syncs repeater sections correctly', async () => {
      const db = initDatabase({ url: TEST_DB }).db;

      const schema: ProjectSchema = {
        ...createTestSchema(),
        pages: [
          {
            slug: 'home',
            name: 'Home',
            sourceFiles: [],
            fieldCount: 1,
            sections: [
              {
                slug: 'features',
                name: 'Features',
                isRepeater: true,
                repeaterConfig: { min: 1, max: 10 },
                order: 0,
                fields: [
                  {
                    path: 'home.features.$.title',
                    type: 'text',
                    file: 'test.tsx',
                    line: 1,
                    column: 1,
                  },
                ],
              },
            ],
          },
        ],
      };

      await syncSchema(db, schema);

      const pages = await getPages(db);
      const sections = await getSectionsByPageId(db, pages[0]!.id);

      expect(sections[0]?.isRepeater).toBe(true);
    });
  });
});
