/**
 * Media query tests.
 */

import { existsSync, rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, initDatabase, resetDatabaseInstance } from '../connection.js';
import { createDatabaseSchema } from '../migrate.js';
import { createMedia, getMediaCount, getMediaList } from '../queries/media.js';

const TEST_DB = '.test/media.db';

function removeDb(): void {
  for (const file of [TEST_DB, `${TEST_DB}-wal`, `${TEST_DB}-shm`]) {
    if (existsSync(file)) rmSync(file, { force: true });
  }
}

describe('Media queries', () => {
  beforeEach(async () => {
    resetDatabaseInstance();
    removeDb();
    await createDatabaseSchema(TEST_DB);
    initDatabase({ url: TEST_DB });
  });

  afterEach(() => {
    closeDatabase();
    removeDb();
  });

  async function seed(names: string[]): Promise<void> {
    const db = initDatabase({ url: TEST_DB }).db;
    for (const originalName of names) {
      await createMedia(db, {
        filename: originalName,
        originalName,
        mimeType: 'image/png',
        size: 1,
        storagePath: `/uploads/${originalName}`,
      });
    }
  }

  describe('search', () => {
    it('finds names containing an underscore', async () => {
      // `_` is a LIKE wildcard. Escaping it only works with an ESCAPE clause;
      // without one the pattern matched nothing at all.
      await seed(['hero_image.png', 'heroXimage.png', 'unrelated.png']);
      const db = initDatabase({ url: TEST_DB }).db;

      const results = await getMediaList(db, { search: 'hero_image' });

      expect(results.map((m) => m.originalName)).toEqual(['hero_image.png']);
      expect(await getMediaCount(db, { search: 'hero_image' })).toBe(1);
    });

    it('treats a percent sign as text, not as "match anything"', async () => {
      await seed(['50%_off.png', 'regular.png']);
      const db = initDatabase({ url: TEST_DB }).db;

      expect((await getMediaList(db, { search: '50%_off' })).map((m) => m.originalName)).toEqual([
        '50%_off.png',
      ]);
      expect(await getMediaList(db, { search: '%' })).toHaveLength(1);
    });

    it('still matches plain substrings', async () => {
      await seed(['banner.png', 'hero.png']);
      const db = initDatabase({ url: TEST_DB }).db;

      expect((await getMediaList(db, { search: 'ban' })).map((m) => m.originalName)).toEqual([
        'banner.png',
      ]);
    });
  });
});
