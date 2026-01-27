import type { FieldSchema, ProjectSchema, } from '@reverso/core';
import { describe, expect, it } from 'vitest';
import {
  deduplicateFields,
  mergeFields,
  normalizeFieldPath,
  normalizeFields,
  validateSchemaStructure,
} from '../schema/normalizer.js';

describe('normalizeFieldPath', () => {
  it('converts to lowercase', () => {
    expect(normalizeFieldPath('Home.Hero.Title')).toBe('home.hero.title');
  });

  it('replaces special characters with underscores', () => {
    expect(normalizeFieldPath('home.hero!.title@')).toBe('home.hero_.title');
  });

  it('removes consecutive dots and underscores', () => {
    expect(normalizeFieldPath('home..hero.__title')).toBe('home.hero._title');
  });

  it('trims whitespace', () => {
    expect(normalizeFieldPath('  home.hero.title  ')).toBe('home.hero.title');
  });
});

describe('normalizeFields', () => {
  it('normalizes all field paths', () => {
    const fields: FieldSchema[] = [
      {
        path: 'Home.Hero.Title',
        type: 'text',
        file: '/src/Hero.tsx',
        line: 10,
        column: 5,
      },
    ];

    const normalized = normalizeFields(fields);

    expect(normalized[0]?.path).toBe('home.hero.title');
  });
});

describe('deduplicateFields', () => {
  it('removes duplicate paths, keeping first occurrence', () => {
    const fields: FieldSchema[] = [
      {
        path: 'home.hero.title',
        type: 'text',
        label: 'First',
        file: '/src/Hero.tsx',
        line: 10,
        column: 5,
      },
      {
        path: 'home.hero.title',
        type: 'textarea',
        label: 'Second',
        file: '/src/Hero.tsx',
        line: 20,
        column: 5,
      },
    ];

    const deduplicated = deduplicateFields(fields);

    expect(deduplicated).toHaveLength(1);
    expect(deduplicated[0]?.label).toBe('First');
    expect(deduplicated[0]?.type).toBe('text');
  });
});

describe('mergeFields', () => {
  it('merges fields with same path', () => {
    const fields: FieldSchema[] = [
      {
        path: 'home.hero.title',
        type: 'text',
        file: '/src/Hero.tsx',
        line: 10,
        column: 5,
      },
      {
        path: 'home.hero.title',
        type: 'text',
        label: 'Title',
        placeholder: 'Enter title',
        file: '/src/Page.tsx',
        line: 20,
        column: 5,
      },
    ];

    const merged = mergeFields(fields);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.label).toBe('Title');
    expect(merged[0]?.placeholder).toBe('Enter title');
    // Original file/line info preserved
    expect(merged[0]?.file).toBe('/src/Hero.tsx');
    expect(merged[0]?.line).toBe(10);
  });
});

describe('validateSchemaStructure', () => {
  it('returns empty array for valid schema', () => {
    const schema: ProjectSchema = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      pages: [
        {
          slug: 'home',
          name: 'Home',
          sections: [
            {
              slug: 'hero',
              name: 'Hero',
              fields: [
                {
                  path: 'home.hero.title',
                  type: 'text',
                  file: '/src/Hero.tsx',
                  line: 10,
                  column: 5,
                },
              ],
              isRepeater: false,
              order: 0,
            },
          ],
          fieldCount: 1,
          sourceFiles: ['/src/Hero.tsx'],
        },
      ],
      pageCount: 1,
      totalFields: 1,
      meta: {
        srcDir: 'src',
        filesScanned: 1,
        filesWithMarkers: 1,
        scanDuration: 100,
      },
    };

    const issues = validateSchemaStructure(schema);

    expect(issues).toHaveLength(0);
  });

  it('detects missing page slug', () => {
    const schema: ProjectSchema = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      pages: [
        {
          slug: '',
          name: 'Home',
          sections: [],
          fieldCount: 0,
          sourceFiles: [],
        },
      ],
      pageCount: 1,
      totalFields: 0,
      meta: {
        srcDir: 'src',
        filesScanned: 0,
        filesWithMarkers: 0,
        scanDuration: 0,
      },
    };

    const issues = validateSchemaStructure(schema);

    expect(issues.some((i) => i.includes('missing slug'))).toBe(true);
  });

  it('detects path mismatch with page', () => {
    const schema: ProjectSchema = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      pages: [
        {
          slug: 'home',
          name: 'Home',
          sections: [
            {
              slug: 'hero',
              name: 'Hero',
              fields: [
                {
                  path: 'about.hero.title', // Wrong page
                  type: 'text',
                  file: '/src/Hero.tsx',
                  line: 10,
                  column: 5,
                },
              ],
              isRepeater: false,
              order: 0,
            },
          ],
          fieldCount: 1,
          sourceFiles: ['/src/Hero.tsx'],
        },
      ],
      pageCount: 1,
      totalFields: 1,
      meta: {
        srcDir: 'src',
        filesScanned: 1,
        filesWithMarkers: 1,
        scanDuration: 100,
      },
    };

    const issues = validateSchemaStructure(schema);

    expect(issues.some((i) => i.includes('about') && i.includes('home'))).toBe(true);
  });
});
