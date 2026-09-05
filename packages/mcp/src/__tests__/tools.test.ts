/**
 * MCP tool handlers against a real SQLite database.
 */

import { existsSync, mkdirSync, rmSync } from 'node:fs';
import type { ProjectSchema } from '@reverso/core';
import {
  closeDatabase,
  createDatabaseSchema,
  type DrizzleDatabase,
  initDatabase,
  resetDatabaseInstance,
  syncSchema,
} from '@reverso/db';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { contentTools } from '../tools/content.js';
import { schemaTools } from '../tools/schema.js';

const TEST_DB = '.test/mcp-tools.db';

const SCHEMA: ProjectSchema = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  pages: [
    {
      slug: 'home',
      name: 'Home',
      sourceFiles: ['src/Home.tsx'],
      fieldCount: 2,
      sections: [
        {
          slug: 'hero',
          name: 'Hero',
          isRepeater: false,
          order: 0,
          fields: [
            { path: 'home.hero.title', type: 'text', label: 'Title', file: 'src/Home.tsx', line: 1, column: 1 },
            { path: 'home.hero.photo', type: 'image', label: 'Photo', file: 'src/Home.tsx', line: 2, column: 1 },
          ],
        },
      ],
    },
  ],
  pageCount: 1,
  totalFields: 2,
  meta: { srcDir: 'src', filesScanned: 1, filesWithMarkers: 1, scanDuration: 1 },
};

describe('MCP tools', () => {
  let db: DrizzleDatabase;

  beforeEach(async () => {
    resetDatabaseInstance();
    mkdirSync('.test', { recursive: true });
    for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
      if (existsSync(f)) rmSync(f, { force: true });
    }
    await createDatabaseSchema(TEST_DB);
    db = initDatabase({ url: TEST_DB }).db;
    await syncSchema(db, SCHEMA);
  });

  afterEach(() => {
    closeDatabase();
    for (const f of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
      if (existsSync(f)) rmSync(f, { force: true });
    }
  });

  it('every tool declares a zod object schema the MCP server can expose', () => {
    for (const group of [contentTools, schemaTools]) {
      for (const [name, tool] of Object.entries(group)) {
        expect(tool.description, name).toBeTruthy();
        expect(typeof tool.inputSchema.parse, name).toBe('function');
        expect(typeof tool.handler, name).toBe('function');
      }
    }
  });

  it('reads the schema', async () => {
    const all = await schemaTools.get_schema.handler(db, {});
    expect(all.totalPages).toBe(1);
    expect(all.pages[0]?.slug).toBe('home');

    const none = await schemaTools.get_schema.handler(db, { pageSlug: 'missing' });
    expect(none.totalPages).toBe(0);

    const images = await schemaTools.get_fields.handler(db, { type: 'image' });
    expect(images.totalFields).toBe(1);
    expect(images.fields[0]?.path).toBe('home.hero.photo');
  });

  it('suggests field types from names', async () => {
    const suggestions = await schemaTools.suggest_field_type.handler(db, { fieldName: 'heroImage' });
    expect(suggestions[0]?.type).toBe('image');
  });

  it('lists pages and reads a page with its content', async () => {
    const pages = await contentTools.list_pages.handler(db, {});
    expect(pages).toHaveLength(1);

    await contentTools.update_content.handler(db, { path: 'home.hero.title', value: 'Hello' });
    const page = await contentTools.get_page.handler(db, { slug: 'home' });
    expect(page.slug).toBe('home');
    expect(Array.isArray(page.content)).toBe(true);
    expect(page.content.some((c) => c.path === 'home.hero.title')).toBe(true);

    await expect(contentTools.get_page.handler(db, { slug: 'nope' })).rejects.toThrow(/not found/i);
  });

  it('updates, publishes and unpublishes content', async () => {
    await expect(
      contentTools.update_content.handler(db, { path: 'home.hero.missing', value: 'x' })
    ).rejects.toThrow();

    const updated = await contentTools.update_content.handler(db, {
      path: 'home.hero.title',
      value: 'Draft title',
    });
    expect(updated).toMatchObject({ path: 'home.hero.title' });

    let current = await contentTools.get_content.handler(db, { path: 'home.hero.title' });
    expect(current.value).toBe('Draft title');

    await contentTools.publish_content.handler(db, { path: 'home.hero.title' });
    current = await contentTools.get_content.handler(db, { path: 'home.hero.title' });
    expect(current.published).toBe(true);

    await contentTools.unpublish_content.handler(db, { path: 'home.hero.title' });
    current = await contentTools.get_content.handler(db, { path: 'home.hero.title' });
    expect(current.published).toBe(false);
  });

  it('bulk updates several fields', async () => {
    const result = await contentTools.bulk_update_content.handler(db, {
      updates: [
        { path: 'home.hero.title', value: 'A' },
        { path: 'home.hero.photo', value: '/a.png' },
      ],
    });
    expect(result).toBeDefined();
    expect((await contentTools.get_content.handler(db, { path: 'home.hero.photo' })).value).toBe('/a.png');
  });
});
