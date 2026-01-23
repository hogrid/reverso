import { describe, expect, it } from 'vitest';
import {
  camelCase,
  constantCase,
  formatLabel,
  kebabCase,
  pascalCase,
  pluralize,
  singularize,
  slugify,
  snakeCase,
  toIdentifier,
  truncate,
} from '../utils/naming.js';

describe('formatLabel', () => {
  it('converts snake_case to Title Case', () => {
    expect(formatLabel('hero_title')).toBe('Hero Title');
  });

  it('converts camelCase to Title Case', () => {
    expect(formatLabel('heroTitle')).toBe('Hero Title');
  });

  it('converts kebab-case to Title Case', () => {
    expect(formatLabel('hero-title')).toBe('Hero Title');
  });

  it('converts PascalCase to Title Case', () => {
    expect(formatLabel('HeroTitle')).toBe('Hero Title');
  });

  it('handles multiple words', () => {
    expect(formatLabel('main_hero_section_title')).toBe('Main Hero Section Title');
  });
});

describe('slugify', () => {
  it('converts to lowercase slug', () => {
    expect(slugify('Hero Title')).toBe('hero-title');
  });

  it('removes special characters', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
  });

  it('handles accented characters', () => {
    expect(slugify('café')).toBe('cafe');
  });

  it('removes duplicate hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });
});

describe('camelCase', () => {
  it('converts kebab-case', () => {
    expect(camelCase('hero-title')).toBe('heroTitle');
  });

  it('converts Title Case', () => {
    expect(camelCase('Hero Title')).toBe('heroTitle');
  });

  it('converts UPPER_CASE', () => {
    expect(camelCase('HERO_TITLE')).toBe('heroTitle');
  });
});

describe('pascalCase', () => {
  it('converts kebab-case', () => {
    expect(pascalCase('hero-title')).toBe('HeroTitle');
  });

  it('converts from space-separated', () => {
    expect(pascalCase('hero title')).toBe('HeroTitle');
  });
});

describe('snakeCase', () => {
  it('converts camelCase', () => {
    expect(snakeCase('heroTitle')).toBe('hero_title');
  });

  it('converts Title Case', () => {
    expect(snakeCase('Hero Title')).toBe('hero_title');
  });

  it('converts kebab-case', () => {
    expect(snakeCase('hero-title')).toBe('hero_title');
  });
});

describe('constantCase', () => {
  it('converts camelCase', () => {
    expect(constantCase('heroTitle')).toBe('HERO_TITLE');
  });

  it('converts kebab-case', () => {
    expect(constantCase('hero-title')).toBe('HERO_TITLE');
  });
});

describe('kebabCase', () => {
  it('converts camelCase', () => {
    expect(kebabCase('heroTitle')).toBe('hero-title');
  });

  it('converts Title Case', () => {
    expect(kebabCase('Hero Title')).toBe('hero-title');
  });
});

describe('pluralize', () => {
  it('adds -s to regular words', () => {
    expect(pluralize('item')).toBe('items');
  });

  it('adds -es to words ending in s, x, z, ch, sh', () => {
    expect(pluralize('status')).toBe('statuses');
    expect(pluralize('box')).toBe('boxes');
    expect(pluralize('buzz')).toBe('buzzes');
    expect(pluralize('match')).toBe('matches');
    expect(pluralize('brush')).toBe('brushes');
  });

  it('converts -y to -ies for consonant + y', () => {
    expect(pluralize('category')).toBe('categories');
  });

  it('handles irregular plurals', () => {
    expect(pluralize('child')).toBe('children');
    expect(pluralize('person')).toBe('people');
  });
});

describe('singularize', () => {
  it('removes -s from regular words', () => {
    expect(singularize('items')).toBe('item');
  });

  it('converts -ies to -y', () => {
    expect(singularize('categories')).toBe('category');
  });

  it('handles irregular singulars', () => {
    expect(singularize('children')).toBe('child');
    expect(singularize('people')).toBe('person');
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...');
  });

  it('does not truncate short strings', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('uses custom suffix', () => {
    expect(truncate('Hello World', 9, '…')).toBe('Hello Wo…');
  });
});

describe('toIdentifier', () => {
  it('converts kebab-case', () => {
    expect(toIdentifier('hero-title')).toBe('heroTitle');
  });

  it('prefixes numbers', () => {
    expect(toIdentifier('123start')).toBe('_123start');
  });

  it('prefixes reserved words', () => {
    expect(toIdentifier('class')).toBe('_class');
    expect(toIdentifier('function')).toBe('_function');
  });
});
