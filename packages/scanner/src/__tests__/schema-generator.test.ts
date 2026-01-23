import type { DetectedField } from '@reverso/core';
import { describe, expect, it } from 'vitest';
import { convertToFieldSchema, generateSchema } from '../schema/generator.js';

describe('generateSchema', () => {
  it('generates schema from detected fields', () => {
    const fields: DetectedField[] = [
      {
        path: 'home.hero.title',
        attributes: { type: 'text', label: 'Title' },
        file: '/src/Hero.tsx',
        line: 10,
        column: 5,
        element: 'h1',
      },
      {
        path: 'home.hero.subtitle',
        attributes: { type: 'textarea' },
        file: '/src/Hero.tsx',
        line: 15,
        column: 5,
        element: 'p',
      },
    ];

    const schema = generateSchema(fields);

    expect(schema.pages).toHaveLength(1);
    expect(schema.pages[0]?.slug).toBe('home');
    expect(schema.pages[0]?.sections).toHaveLength(1);
    expect(schema.pages[0]?.sections[0]?.slug).toBe('hero');
    expect(schema.pages[0]?.sections[0]?.fields).toHaveLength(2);
  });

  it('groups fields by page and section', () => {
    const fields: DetectedField[] = [
      {
        path: 'home.hero.title',
        attributes: { type: 'text' },
        file: '/src/Hero.tsx',
        line: 10,
        column: 5,
        element: 'h1',
      },
      {
        path: 'about.team.name',
        attributes: { type: 'text' },
        file: '/src/Team.tsx',
        line: 20,
        column: 5,
        element: 'h2',
      },
    ];

    const schema = generateSchema(fields);

    expect(schema.pages).toHaveLength(2);
    expect(schema.pageCount).toBe(2);
    expect(schema.totalFields).toBe(2);
  });

  it('detects repeater sections', () => {
    const fields: DetectedField[] = [
      {
        path: 'home.features.$.title',
        attributes: { type: 'text' },
        file: '/src/Features.tsx',
        line: 10,
        column: 5,
        element: 'h3',
      },
    ];

    const schema = generateSchema(fields);

    expect(schema.pages[0]?.sections[0]?.isRepeater).toBe(true);
  });

  it('sorts fields when sort option is true', () => {
    const fields: DetectedField[] = [
      {
        path: 'home.hero.subtitle',
        attributes: { type: 'text' },
        file: '/src/Hero.tsx',
        line: 20,
        column: 5,
        element: 'p',
      },
      {
        path: 'home.hero.title',
        attributes: { type: 'text' },
        file: '/src/Hero.tsx',
        line: 10,
        column: 5,
        element: 'h1',
      },
    ];

    const schema = generateSchema(fields, { sort: true });

    expect(schema.pages[0]?.sections[0]?.fields[0]?.path).toBe('home.hero.subtitle');
    expect(schema.pages[0]?.sections[0]?.fields[1]?.path).toBe('home.hero.title');
  });
});

describe('convertToFieldSchema', () => {
  it('converts detected field to field schema', () => {
    const field: DetectedField = {
      path: 'home.hero.title',
      attributes: {
        type: 'text',
        label: 'Title',
        required: 'true',
        placeholder: 'Enter title',
      },
      file: '/src/Hero.tsx',
      line: 10,
      column: 5,
      element: 'h1',
      textContent: 'Welcome',
    };

    const schema = convertToFieldSchema(field);

    expect(schema.path).toBe('home.hero.title');
    expect(schema.type).toBe('text');
    expect(schema.label).toBe('Title');
    expect(schema.required).toBe(true);
    expect(schema.placeholder).toBe('Enter title');
    expect(schema.file).toBe('/src/Hero.tsx');
    expect(schema.line).toBe(10);
    expect(schema.defaultContent).toBe('Welcome');
  });

  it('uses default field type when not specified', () => {
    const field: DetectedField = {
      path: 'home.hero.title',
      attributes: {},
      file: '/src/Hero.tsx',
      line: 10,
      column: 5,
      element: 'h1',
    };

    const schema = convertToFieldSchema(field);

    expect(schema.type).toBe('text');
  });

  it('generates label from path when not provided', () => {
    const field: DetectedField = {
      path: 'home.hero.main_title',
      attributes: { type: 'text' },
      file: '/src/Hero.tsx',
      line: 10,
      column: 5,
      element: 'h1',
    };

    const schema = convertToFieldSchema(field);

    expect(schema.label).toBe('Main Title');
  });

  it('parses numeric attributes', () => {
    const field: DetectedField = {
      path: 'home.hero.rating',
      attributes: {
        type: 'number',
        min: '1',
        max: '10',
        step: '0.5',
      },
      file: '/src/Hero.tsx',
      line: 10,
      column: 5,
      element: 'input',
    };

    const schema = convertToFieldSchema(field);

    expect(schema.min).toBe(1);
    expect(schema.max).toBe(10);
    expect(schema.step).toBe(0.5);
  });

  it('parses boolean attributes', () => {
    const field: DetectedField = {
      path: 'home.hero.featured',
      attributes: {
        type: 'boolean',
        required: 'true',
        multiple: '',
        readonly: 'true',
      },
      file: '/src/Hero.tsx',
      line: 10,
      column: 5,
      element: 'input',
    };

    const schema = convertToFieldSchema(field);

    expect(schema.required).toBe(true);
    expect(schema.multiple).toBe(true);
    expect(schema.readonly).toBe(true);
  });
});
