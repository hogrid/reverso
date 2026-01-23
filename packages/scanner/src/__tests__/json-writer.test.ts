import type { FieldSchema, ProjectSchema } from '@reverso/core';
import { describe, expect, it } from 'vitest';
import { compareSchemas, formatSchemaDiff } from '../output/json-writer.js';

describe('compareSchemas', () => {
  const baseSchema: ProjectSchema = {
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
                label: 'Title',
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

  it('detects added fields', () => {
    const newSchema: ProjectSchema = {
      ...baseSchema,
      pages: [
        {
          ...baseSchema.pages[0]!,
          sections: [
            {
              ...baseSchema.pages[0]?.sections[0]!,
              fields: [
                ...(baseSchema.pages[0]?.sections[0]?.fields ?? []),
                {
                  path: 'home.hero.subtitle',
                  type: 'text',
                  file: '/src/Hero.tsx',
                  line: 15,
                  column: 5,
                },
              ],
            },
          ],
        },
      ],
    };

    const diff = compareSchemas(baseSchema, newSchema);

    expect(diff.hasChanges).toBe(true);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]?.path).toBe('home.hero.subtitle');
    expect(diff.removed).toHaveLength(0);
    expect(diff.modified).toHaveLength(0);
  });

  it('detects removed fields', () => {
    const newSchema: ProjectSchema = {
      ...baseSchema,
      pages: [
        {
          ...baseSchema.pages[0]!,
          sections: [
            {
              ...baseSchema.pages[0]?.sections[0]!,
              fields: [],
            },
          ],
        },
      ],
    };

    const diff = compareSchemas(baseSchema, newSchema);

    expect(diff.hasChanges).toBe(true);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(1);
    expect(diff.removed[0]?.path).toBe('home.hero.title');
  });

  it('detects modified fields', () => {
    const newSchema: ProjectSchema = {
      ...baseSchema,
      pages: [
        {
          ...baseSchema.pages[0]!,
          sections: [
            {
              ...baseSchema.pages[0]?.sections[0]!,
              fields: [
                {
                  ...baseSchema.pages[0]?.sections[0]?.fields[0]!,
                  type: 'textarea', // Changed
                  label: 'New Title', // Changed
                },
              ],
            },
          ],
        },
      ],
    };

    const diff = compareSchemas(baseSchema, newSchema);

    expect(diff.hasChanges).toBe(true);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0]?.path).toBe('home.hero.title');
    expect(diff.modified[0]?.changes).toContain('type');
    expect(diff.modified[0]?.changes).toContain('label');
  });

  it('handles null before schema', () => {
    const diff = compareSchemas(null, baseSchema);

    expect(diff.hasChanges).toBe(true);
    expect(diff.added).toHaveLength(1);
    expect(diff.removed).toHaveLength(0);
  });

  it('returns no changes for identical schemas', () => {
    const diff = compareSchemas(baseSchema, baseSchema);

    expect(diff.hasChanges).toBe(false);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.modified).toHaveLength(0);
  });
});

describe('formatSchemaDiff', () => {
  it('formats added fields', () => {
    const diff = {
      added: [{ path: 'home.hero.title', type: 'text' } as FieldSchema],
      removed: [],
      modified: [],
      hasChanges: true,
    };

    const formatted = formatSchemaDiff(diff);

    expect(formatted).toContain('Added (1)');
    expect(formatted).toContain('+ home.hero.title (text)');
  });

  it('formats removed fields', () => {
    const diff = {
      added: [],
      removed: [{ path: 'home.hero.subtitle', type: 'textarea' } as FieldSchema],
      modified: [],
      hasChanges: true,
    };

    const formatted = formatSchemaDiff(diff);

    expect(formatted).toContain('Removed (1)');
    expect(formatted).toContain('- home.hero.subtitle (textarea)');
  });

  it('formats modified fields', () => {
    const diff = {
      added: [],
      removed: [],
      modified: [
        {
          path: 'home.hero.title',
          before: { path: 'home.hero.title', type: 'text' } as FieldSchema,
          after: { path: 'home.hero.title', type: 'textarea' } as FieldSchema,
          changes: ['type', 'label'],
        },
      ],
      hasChanges: true,
    };

    const formatted = formatSchemaDiff(diff);

    expect(formatted).toContain('Modified (1)');
    expect(formatted).toContain('~ home.hero.title: type, label');
  });

  it('shows no changes message', () => {
    const diff = {
      added: [],
      removed: [],
      modified: [],
      hasChanges: false,
    };

    const formatted = formatSchemaDiff(diff);

    expect(formatted).toContain('No changes detected');
  });
});
