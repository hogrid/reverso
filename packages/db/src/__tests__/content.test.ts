/**
 * Content queries tests.
 */

import { existsSync, rmSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { closeDatabase, initDatabase, resetDatabaseInstance } from '../connection.js';
import { createDatabase } from '../migrate.js';
import {
  createContent,
  getContentByFieldId,
  getContentById,
  getContentHistory,
  parseContentValue,
  updateContent,
  upsertContent,
} from '../queries/content.js';
import { createField } from '../queries/fields.js';
import { createPage } from '../queries/pages.js';
import { createSection } from '../queries/sections.js';

const TEST_DB = '.test/content.db';

describe('Content Queries', () => {
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

  async function setupField() {
    const db = initDatabase({ url: TEST_DB }).db;
    const page = await createPage(db, { slug: 'home', name: 'Home' });
    const section = await createSection(db, {
      pageId: page.id,
      slug: 'hero',
      name: 'Hero',
    });
    const field = await createField(db, {
      sectionId: section.id,
      path: 'home.hero.title',
      type: 'text',
    });
    return { db, page, section, field };
  }

  describe('createContent', () => {
    it('creates content with string value', async () => {
      const { db, field } = await setupField();

      const content = await createContent(db, {
        fieldId: field.id,
        value: 'Hello World',
      });

      expect(content.id).toBeDefined();
      expect(content.fieldId).toBe(field.id);
      expect(content.locale).toBe('default');
      expect(parseContentValue(content)).toBe('Hello World');
    });

    it('creates content with object value', async () => {
      const { db, field } = await setupField();

      const imageValue = {
        url: '/images/hero.jpg',
        alt: 'Hero image',
        width: 1920,
        height: 1080,
      };

      const content = await createContent(db, {
        fieldId: field.id,
        value: imageValue,
      });

      expect(parseContentValue(content)).toEqual(imageValue);
    });

    it('creates content with locale', async () => {
      const { db, field } = await setupField();

      const content = await createContent(db, {
        fieldId: field.id,
        locale: 'pt-BR',
        value: 'Olá Mundo',
      });

      expect(content.locale).toBe('pt-BR');
    });
  });

  describe('getContentByFieldId', () => {
    it('returns content for field and locale', async () => {
      const { db, field } = await setupField();

      await createContent(db, { fieldId: field.id, value: 'English' });
      await createContent(db, { fieldId: field.id, locale: 'pt', value: 'Português' });

      const english = await getContentByFieldId(db, field.id, 'default');
      const portuguese = await getContentByFieldId(db, field.id, 'pt');

      expect(parseContentValue(english!)).toBe('English');
      expect(parseContentValue(portuguese!)).toBe('Português');
    });
  });

  describe('updateContent', () => {
    it('updates content value and creates history', async () => {
      const { db, field } = await setupField();

      const content = await createContent(db, {
        fieldId: field.id,
        value: 'Original',
      });

      const updated = await updateContent(db, content.id, {
        value: 'Updated',
        changedBy: 'user-123',
      });

      expect(parseContentValue(updated!)).toBe('Updated');

      const history = await getContentHistory(db, content.id);
      expect(history).toHaveLength(1);
      expect(history[0]?.changedBy).toBe('user-123');
    });

    it('publishes content', async () => {
      const { db, field } = await setupField();

      const content = await createContent(db, {
        fieldId: field.id,
        value: 'Draft',
      });

      expect(content.published).toBe(false);

      const published = await updateContent(db, content.id, { published: true });
      expect(published?.published).toBe(true);
      expect(published?.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('upsertContent', () => {
    it('creates content when it does not exist', async () => {
      const { db, field } = await setupField();

      const content = await upsertContent(db, {
        fieldId: field.id,
        value: 'New Content',
      });

      expect(content.id).toBeDefined();
      expect(parseContentValue(content)).toBe('New Content');
    });

    it('updates content when it exists', async () => {
      const { db, field } = await setupField();

      await createContent(db, { fieldId: field.id, value: 'Original' });

      const updated = await upsertContent(db, {
        fieldId: field.id,
        value: 'Updated',
      });

      expect(parseContentValue(updated)).toBe('Updated');

      const all = await getContentByFieldId(db, field.id);
      expect(all).toBeDefined();
    });
  });

  describe('content history', () => {
    it('tracks multiple changes', async () => {
      const { db, field } = await setupField();

      const content = await createContent(db, {
        fieldId: field.id,
        value: 'Version 1',
      });

      await updateContent(db, content.id, { value: 'Version 2' });
      await updateContent(db, content.id, { value: 'Version 3' });

      const history = await getContentHistory(db, content.id);
      expect(history).toHaveLength(2);
    });
  });
});
