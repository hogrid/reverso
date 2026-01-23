import { describe, expect, it } from 'vitest';
import {
  extractAttributeName,
  isValidAttribute,
  isValidFieldPath,
  isValidFieldType,
  parseCondition,
  parseOptions,
  validateFieldAttributes,
} from '../utils/validation.js';

describe('isValidFieldType', () => {
  it('returns true for valid field types', () => {
    expect(isValidFieldType('text')).toBe(true);
    expect(isValidFieldType('textarea')).toBe(true);
    expect(isValidFieldType('wysiwyg')).toBe(true);
    expect(isValidFieldType('image')).toBe(true);
    expect(isValidFieldType('repeater')).toBe(true);
  });

  it('returns false for invalid field types', () => {
    expect(isValidFieldType('invalid')).toBe(false);
    expect(isValidFieldType('')).toBe(false);
    expect(isValidFieldType('TEXT')).toBe(false);
  });
});

describe('isValidFieldPath', () => {
  it('returns true for valid paths', () => {
    expect(isValidFieldPath('home.hero.title')).toBe(true);
    expect(isValidFieldPath('home.features.$.title')).toBe(true);
  });

  it('returns false for invalid paths', () => {
    expect(isValidFieldPath('home.hero')).toBe(false);
    expect(isValidFieldPath('')).toBe(false);
  });
});

describe('validateFieldAttributes', () => {
  it('validates correct attributes', () => {
    const result = validateFieldAttributes({
      type: 'text',
      label: 'Title',
      required: true,
    });
    expect(result.success).toBe(true);
    expect(result.data?.type).toBe('text');
    expect(result.data?.label).toBe('Title');
    expect(result.data?.required).toBe(true);
  });

  it('coerces string booleans', () => {
    const result = validateFieldAttributes({
      required: 'true',
    });
    expect(result.success).toBe(true);
    expect(result.data?.required).toBe(true);
  });

  it('coerces string numbers', () => {
    const result = validateFieldAttributes({
      min: '5',
      max: '100',
    });
    expect(result.success).toBe(true);
    expect(result.data?.min).toBe(5);
    expect(result.data?.max).toBe(100);
  });
});

describe('isValidAttribute', () => {
  it('returns true for valid attributes', () => {
    expect(isValidAttribute('data-reverso')).toBe(true);
    expect(isValidAttribute('data-reverso-type')).toBe(true);
    expect(isValidAttribute('data-reverso-label')).toBe(true);
  });

  it('returns false for invalid attributes', () => {
    expect(isValidAttribute('data-invalid')).toBe(false);
    expect(isValidAttribute('data-reverso-invalid')).toBe(false);
  });
});

describe('extractAttributeName', () => {
  it('extracts attribute name from data-reverso-*', () => {
    expect(extractAttributeName('data-reverso-type')).toBe('type');
    expect(extractAttributeName('data-reverso-label')).toBe('label');
  });

  it('returns null for data-reverso (path attribute)', () => {
    expect(extractAttributeName('data-reverso')).toBeNull();
  });

  it('returns null for non-reverso attributes', () => {
    expect(extractAttributeName('data-other')).toBeNull();
  });
});

describe('parseOptions', () => {
  it('parses comma-separated values', () => {
    const result = parseOptions('red,green,blue');
    expect(result).toEqual([
      { label: 'Red', value: 'red' },
      { label: 'Green', value: 'green' },
      { label: 'Blue', value: 'blue' },
    ]);
  });

  it('parses JSON array', () => {
    const result = parseOptions('[{"label":"Red","value":"#f00"}]');
    expect(result).toEqual([{ label: 'Red', value: '#f00' }]);
  });

  it('parses JSON array with string values', () => {
    const result = parseOptions('["red","green","blue"]');
    expect(result).toEqual([
      { label: 'Red', value: 'red' },
      { label: 'Green', value: 'green' },
      { label: 'Blue', value: 'blue' },
    ]);
  });
});

describe('parseCondition', () => {
  it('parses equality condition', () => {
    const result = parseCondition('type=post');
    expect(result).toEqual({
      field: 'type',
      operator: '=',
      value: 'post',
    });
  });

  it('parses inequality condition', () => {
    const result = parseCondition('status!=draft');
    expect(result).toEqual({
      field: 'status',
      operator: '!=',
      value: 'draft',
    });
  });

  it('parses comparison conditions', () => {
    expect(parseCondition('count>5')).toEqual({
      field: 'count',
      operator: '>',
      value: '5',
    });
    expect(parseCondition('count>=5')).toEqual({
      field: 'count',
      operator: '>=',
      value: '5',
    });
  });

  it('returns null for invalid condition', () => {
    expect(parseCondition('invalid')).toBeNull();
  });
});
