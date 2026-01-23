/**
 * Page queries tests.
 */

import { existsSync, rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, initDatabase, resetDatabaseInstance } from '../connection.js';
import { createDatabase } from '../migrate.js';
import {
  createPage,
  deletePage,
  getPageById,
  getPageBySlug,
  getPages,
  parseSourceFiles,
  updatePage,
  upsertPage,
} from '../queries/pages.js';

const TEST_DB = '.test/pages.db';

describe('Page Queries', () => {
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

  describe('createPage', () => {
    it('creates a new page', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const page = await createPage(db, {
        slug: 'home',
        name: 'Home Page',
        sourceFiles: ['src/pages/home.tsx'],
        fieldCount: 5,
      });

      expect(page.id).toBeDefined();
      expect(page.slug).toBe('home');
      expect(page.name).toBe('Home Page');
      expect(page.fieldCount).toBe(5);
      expect(page.createdAt).toBeInstanceOf(Date);
    });

    it('creates page with default values', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const page = await createPage(db, {
        slug: 'about',
        name: 'About',
      });

      expect(page.fieldCount).toBe(0);
    });
  });

  describe('getPages', () => {
    it('returns all pages sorted by slug', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      await createPage(db, { slug: 'home', name: 'Home' });
      await createPage(db, { slug: 'about', name: 'About' });
      await createPage(db, { slug: 'contact', name: 'Contact' });

      const pages = await getPages(db);
      expect(pages).toHaveLength(3);
      expect(pages[0]?.slug).toBe('about');
      expect(pages[1]?.slug).toBe('contact');
      expect(pages[2]?.slug).toBe('home');
    });

    it('returns empty array when no pages', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const pages = await getPages(db);
      expect(pages).toHaveLength(0);
    });
  });

  describe('getPageById', () => {
    it('returns page by ID', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const created = await createPage(db, { slug: 'home', name: 'Home' });
      const found = await getPageById(db, created.id);

      expect(found).toBeDefined();
      expect(found?.slug).toBe('home');
    });

    it('returns undefined for non-existent ID', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const found = await getPageById(db, 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('getPageBySlug', () => {
    it('returns page by slug', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      await createPage(db, { slug: 'about', name: 'About Page' });
      const found = await getPageBySlug(db, 'about');

      expect(found).toBeDefined();
      expect(found?.name).toBe('About Page');
    });

    it('returns undefined for non-existent slug', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const found = await getPageBySlug(db, 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('updatePage', () => {
    it('updates page fields', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const created = await createPage(db, { slug: 'home', name: 'Home' });

      const updated = await updatePage(db, created.id, {
        name: 'Home Page Updated',
        fieldCount: 10,
      });

      expect(updated?.name).toBe('Home Page Updated');
      expect(updated?.fieldCount).toBe(10);
    });

    it('returns undefined for non-existent page', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const result = await updatePage(db, 'non-existent', { name: 'New' });
      expect(result).toBeUndefined();
    });
  });

  describe('deletePage', () => {
    it('deletes a page', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const created = await createPage(db, { slug: 'temp', name: 'Temp' });
      await deletePage(db, created.id);

      const found = await getPageById(db, created.id);
      expect(found).toBeUndefined();
    });
  });

  describe('upsertPage', () => {
    it('creates page when it does not exist', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const page = await upsertPage(db, { slug: 'new', name: 'New Page' });

      expect(page.slug).toBe('new');
      const found = await getPageBySlug(db, 'new');
      expect(found).toBeDefined();
    });

    it('updates page when it exists', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      await createPage(db, { slug: 'existing', name: 'Original' });

      const updated = await upsertPage(db, {
        slug: 'existing',
        name: 'Updated',
        fieldCount: 5,
      });

      expect(updated.name).toBe('Updated');
      expect(updated.fieldCount).toBe(5);
    });
  });

  describe('parseSourceFiles', () => {
    it('parses source files from JSON', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const page = await createPage(db, {
        slug: 'test',
        name: 'Test',
        sourceFiles: ['file1.tsx', 'file2.tsx'],
      });

      const files = parseSourceFiles(page);
      expect(files).toEqual(['file1.tsx', 'file2.tsx']);
    });

    it('returns empty array for null source files', async () => {
      const db = initDatabase({ url: TEST_DB }).db;
      const page = await createPage(db, { slug: 'test', name: 'Test' });

      const files = parseSourceFiles(page);
      expect(files).toEqual([]);
    });
  });
});
