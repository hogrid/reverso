import type { ProjectSchema } from '@reverso/core';
import { describe, expect, it } from 'vitest';
import { generateTypeDefinitions } from '../output/types-writer.js';

describe('generateTypeDefinitions', () => {
  const baseSchema: ProjectSchema = {
    version: '1.0.0',
    generatedAt: '2024-01-01T00:00:00.000Z',
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
                required: true,
                file: '/src/Hero.tsx',
                line: 10,
                column: 5,
              },
              {
                path: 'home.hero.subtitle',
                type: 'textarea',
                file: '/src/Hero.tsx',
                line: 15,
                column: 5,
              },
              {
                path: 'home.hero.image',
                type: 'image',
                file: '/src/Hero.tsx',
                line: 20,
                column: 5,
              },
            ],
            isRepeater: false,
            order: 0,
          },
        ],
        fieldCount: 3,
        sourceFiles: ['/src/Hero.tsx'],
      },
    ],
    pageCount: 1,
    totalFields: 3,
    meta: {
      srcDir: 'src',
      filesScanned: 1,
      filesWithMarkers: 1,
      scanDuration: 100,
    },
  };

  it('generates type definitions', () => {
    const types = generateTypeDefinitions(baseSchema);

    expect(types).toContain('Auto-generated types');
    expect(types).toContain('import type {');
    expect(types).toContain('ImageValue');
  });

  it('generates page content interface', () => {
    const types = generateTypeDefinitions(baseSchema);

    expect(types).toContain('export interface HomeContent {');
    expect(types).toContain('hero: HomeHero;');
  });

  it('generates section interface', () => {
    const types = generateTypeDefinitions(baseSchema);

    expect(types).toContain('export interface HomeHero {');
  });

  it('maps field types correctly', () => {
    const types = generateTypeDefinitions(baseSchema);

    // Required field without optional modifier
    expect(types).toContain('title: string;');
    // Optional field with ? modifier
    expect(types).toContain('subtitle?: string;');
    // Image type mapped to ImageValue
    expect(types).toContain('image?: ImageValue;');
  });

  it('generates root content type', () => {
    const types = generateTypeDefinitions(baseSchema);

    expect(types).toContain('export interface ReversoContent {');
    expect(types).toContain('home: HomeContent;');
  });

  it('includes JSDoc comments by default', () => {
    const types = generateTypeDefinitions(baseSchema);

    expect(types).toContain('/** Content for the Home page */');
    expect(types).toContain('/** Hero section */');
    expect(types).toContain('/** Title */');
  });

  it('excludes comments when disabled', () => {
    const types = generateTypeDefinitions(baseSchema, {
      outputDir: '',
      includeComments: false,
    });

    expect(types).not.toContain('/** Content for the Home page */');
  });

  it('handles repeater sections', () => {
    const schemaWithRepeater: ProjectSchema = {
      ...baseSchema,
      pages: [
        {
          slug: 'home',
          name: 'Home',
          sections: [
            {
              slug: 'features',
              name: 'Features',
              fields: [
                {
                  path: 'home.features.$.title',
                  type: 'text',
                  file: '/src/Features.tsx',
                  line: 10,
                  column: 5,
                },
              ],
              isRepeater: true,
              order: 0,
            },
          ],
          fieldCount: 1,
          sourceFiles: ['/src/Features.tsx'],
        },
      ],
    };

    const types = generateTypeDefinitions(schemaWithRepeater);

    expect(types).toContain('features: HomeFeaturesItem[];');
    expect(types).toContain('export interface HomeFeaturesItem {');
  });

  it('maps all field types correctly', () => {
    const schemaWithAllTypes: ProjectSchema = {
      ...baseSchema,
      pages: [
        {
          slug: 'test',
          name: 'Test',
          sections: [
            {
              slug: 'fields',
              name: 'Fields',
              fields: [
                { path: 'test.fields.text', type: 'text', file: '', line: 1, column: 0 },
                { path: 'test.fields.number', type: 'number', file: '', line: 2, column: 0 },
                { path: 'test.fields.boolean', type: 'boolean', file: '', line: 3, column: 0 },
                { path: 'test.fields.select', type: 'select', file: '', line: 4, column: 0 },
                {
                  path: 'test.fields.multiselect',
                  type: 'multiselect',
                  file: '',
                  line: 5,
                  column: 0,
                },
                { path: 'test.fields.date', type: 'date', file: '', line: 6, column: 0 },
                { path: 'test.fields.image', type: 'image', file: '', line: 7, column: 0 },
                { path: 'test.fields.file', type: 'file', file: '', line: 8, column: 0 },
                { path: 'test.fields.gallery', type: 'gallery', file: '', line: 9, column: 0 },
                { path: 'test.fields.link', type: 'link', file: '', line: 10, column: 0 },
                { path: 'test.fields.map', type: 'map', file: '', line: 11, column: 0 },
                { path: 'test.fields.blocks', type: 'blocks', file: '', line: 12, column: 0 },
              ],
              isRepeater: false,
              order: 0,
            },
          ],
          fieldCount: 12,
          sourceFiles: [],
        },
      ],
    };

    const types = generateTypeDefinitions(schemaWithAllTypes);

    expect(types).toContain('text?: string;');
    expect(types).toContain('number?: number;');
    expect(types).toContain('boolean?: boolean;');
    expect(types).toContain('select?: string;');
    expect(types).toContain('multiselect?: string[];');
    expect(types).toContain('date?: string;');
    expect(types).toContain('image?: ImageValue;');
    expect(types).toContain('file?: FileValue;');
    expect(types).toContain('gallery?: GalleryValue;');
    expect(types).toContain('link?: LinkValue;');
    expect(types).toContain('map?: MapValue;');
    expect(types).toContain('blocks?: BlocksValue;');
  });
});
