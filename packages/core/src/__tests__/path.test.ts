import { describe, expect, it } from 'vitest';
import {
  buildPath,
  getFieldFromPath,
  getPageFromPath,
  getPageSectionPath,
  getParentPath,
  getSectionFromPath,
  groupPathsByPage,
  groupPathsBySection,
  isRepeaterPath,
  matchPath,
  parsePath,
  sortPaths,
} from '../utils/path.js';

describe('parsePath', () => {
  it('parses a simple path', () => {
    const result = parsePath('home.hero.title');
    expect(result).toEqual({
      page: 'home',
      section: 'hero',
      field: 'title',
      isRepeater: false,
      full: 'home.hero.title',
    });
  });

  it('parses a nested field path', () => {
    const result = parsePath('home.hero.cta.text');
    expect(result).toEqual({
      page: 'home',
      section: 'hero',
      field: 'cta.text',
      isRepeater: false,
      full: 'home.hero.cta.text',
    });
  });

  it('parses a repeater path', () => {
    const result = parsePath('home.features.$.title');
    expect(result).toEqual({
      page: 'home',
      section: 'features',
      field: '$',
      isRepeater: true,
      repeaterField: 'title',
      full: 'home.features.$.title',
    });
  });

  it('parses a repeater path without field', () => {
    const result = parsePath('home.features.$');
    expect(result).toEqual({
      page: 'home',
      section: 'features',
      field: '$',
      isRepeater: true,
      repeaterField: undefined,
      full: 'home.features.$',
    });
  });

  it('throws for invalid path with less than 3 parts', () => {
    expect(() => parsePath('home.hero')).toThrow('must have at least 3 parts');
  });

  it('throws for path with empty parts', () => {
    expect(() => parsePath('home..title')).toThrow('contains empty segment');
  });

  it('throws for path with multiple $ placeholders', () => {
    expect(() => parsePath('home.$.$.title')).toThrow(
      'can only contain one $ repeater placeholder'
    );
  });

  it('throws for path with $ in wrong position', () => {
    expect(() => parsePath('home.$.features.title')).toThrow('$ placeholder must be at position 3');
  });
});

describe('buildPath', () => {
  it('builds a simple path', () => {
    expect(buildPath('home', 'hero', 'title')).toBe('home.hero.title');
  });

  it('builds a path with more parts', () => {
    expect(buildPath('home', 'hero', 'cta', 'text')).toBe('home.hero.cta.text');
  });

  it('builds a repeater path', () => {
    expect(buildPath('home', 'features', '$', 'title')).toBe('home.features.$.title');
  });

  it('throws for less than 3 parts', () => {
    expect(() => buildPath('home', 'hero')).toThrow('at least 3 parts');
  });

  it('throws for empty parts', () => {
    expect(() => buildPath('home', '', 'title')).toThrow('cannot be empty');
  });

  it('throws for multiple $ placeholders', () => {
    expect(() => buildPath('home', '$', '$', 'title')).toThrow(
      'can only contain one $ repeater placeholder'
    );
  });

  it('throws for $ in wrong position', () => {
    expect(() => buildPath('home', '$', 'features', 'title')).toThrow('$ must be at position 3');
  });

  it('throws for whitespace-only parts', () => {
    expect(() => buildPath('home', '  ', 'title')).toThrow('cannot be empty');
  });
});

describe('getPageFromPath', () => {
  it('extracts page from path', () => {
    expect(getPageFromPath('home.hero.title')).toBe('home');
  });
});

describe('getSectionFromPath', () => {
  it('extracts section from path', () => {
    expect(getSectionFromPath('home.hero.title')).toBe('hero');
  });
});

describe('getFieldFromPath', () => {
  it('extracts field from path', () => {
    expect(getFieldFromPath('home.hero.title')).toBe('title');
  });

  it('extracts repeater field from path', () => {
    expect(getFieldFromPath('home.features.$.title')).toBe('title');
  });
});

describe('isRepeaterPath', () => {
  it('returns true for repeater path', () => {
    expect(isRepeaterPath('home.features.$.title')).toBe(true);
  });

  it('returns true for repeater path ending with $', () => {
    expect(isRepeaterPath('home.features.$')).toBe(true);
  });

  it('returns false for non-repeater path', () => {
    expect(isRepeaterPath('home.hero.title')).toBe(false);
  });
});

describe('getParentPath', () => {
  it('returns parent path', () => {
    expect(getParentPath('home.hero.title')).toBe('home.hero');
  });

  it('returns parent for nested path', () => {
    expect(getParentPath('home.hero.cta.text')).toBe('home.hero.cta');
  });
});

describe('getPageSectionPath', () => {
  it('returns page.section path', () => {
    expect(getPageSectionPath('home.hero.title')).toBe('home.hero');
  });
});

describe('matchPath', () => {
  it('matches exact path', () => {
    expect(matchPath('home.hero.title', 'home.hero.title')).toBe(true);
  });

  it('matches with wildcard', () => {
    expect(matchPath('home.hero.title', 'home.*.title')).toBe(true);
    expect(matchPath('home.hero.title', '*.hero.*')).toBe(true);
  });

  it('does not match different paths', () => {
    expect(matchPath('home.hero.title', 'about.hero.title')).toBe(false);
  });

  it('does not match different lengths', () => {
    expect(matchPath('home.hero.title', 'home.hero')).toBe(false);
  });
});

describe('sortPaths', () => {
  it('sorts paths alphabetically', () => {
    const paths = [
      'home.hero.title',
      'about.team.name',
      'home.features.$.title',
      'about.hero.title',
    ];
    const sorted = sortPaths(paths);
    expect(sorted).toEqual([
      'about.hero.title',
      'about.team.name',
      'home.features.$.title',
      'home.hero.title',
    ]);
  });
});

describe('groupPathsByPage', () => {
  it('groups paths by page', () => {
    const paths = ['home.hero.title', 'about.team.name', 'home.features.$.title'];
    const grouped = groupPathsByPage(paths);
    expect(grouped.get('home')).toEqual(['home.hero.title', 'home.features.$.title']);
    expect(grouped.get('about')).toEqual(['about.team.name']);
  });
});

describe('groupPathsBySection', () => {
  it('groups paths by page and section', () => {
    const paths = ['home.hero.title', 'home.hero.subtitle', 'home.features.$.title'];
    const grouped = groupPathsBySection(paths);
    const homeSections = grouped.get('home');
    expect(homeSections?.get('hero')).toEqual(['home.hero.title', 'home.hero.subtitle']);
    expect(homeSections?.get('features')).toEqual(['home.features.$.title']);
  });
});
