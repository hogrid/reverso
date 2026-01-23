/**
 * Path utilities for parsing and building field paths.
 * Field paths follow the format: page.section.field or page.section.$.field for repeaters.
 */

import { PATH_SEPARATOR, REPEATER_PLACEHOLDER } from '../constants.js';
import type { ParsedPath } from '../types/schema.js';

/**
 * Parse a field path into its components.
 *
 * @example
 * ```ts
 * parsePath('home.hero.title')
 * // { page: 'home', section: 'hero', field: 'title', isRepeater: false, full: 'home.hero.title' }
 *
 * parsePath('home.features.$.title')
 * // { page: 'home', section: 'features', field: '$', isRepeater: true, repeaterField: 'title', full: 'home.features.$.title' }
 * ```
 */
export function parsePath(path: string): ParsedPath {
  const trimmed = path.trim();

  if (!trimmed) {
    throw new Error('Path cannot be empty');
  }

  const parts = trimmed.split(PATH_SEPARATOR);

  if (parts.length < 3) {
    throw new Error(`Invalid path "${path}": must have at least 3 parts (page.section.field)`);
  }

  // Check for empty parts (consecutive dots or leading/trailing dots)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || (part !== REPEATER_PLACEHOLDER && part.trim() === '')) {
      throw new Error(`Invalid path "${path}": contains empty segment at position ${i + 1}`);
    }
  }

  const page = parts[0]!;
  const section = parts[1]!;

  // Count $ placeholders
  const dollarCount = parts.filter((p) => p === REPEATER_PLACEHOLDER).length;

  if (dollarCount > 1) {
    throw new Error(`Invalid path "${path}": can only contain one $ repeater placeholder`);
  }

  const isRepeater = dollarCount === 1;

  if (isRepeater) {
    const repeaterIndex = parts.indexOf(REPEATER_PLACEHOLDER);

    // $ must be at position 2 (third element: page.section.$)
    if (repeaterIndex !== 2) {
      throw new Error(
        `Invalid path "${path}": $ placeholder must be at position 3 (page.section.$)`
      );
    }

    const repeaterField = parts.slice(repeaterIndex + 1).join(PATH_SEPARATOR) || undefined;

    return {
      page,
      section,
      field: REPEATER_PLACEHOLDER,
      isRepeater: true,
      repeaterField,
      full: trimmed,
    };
  }

  // For non-repeaters: page.section.field
  const field = parts.slice(2).join(PATH_SEPARATOR);

  return {
    page,
    section,
    field,
    isRepeater: false,
    full: trimmed,
  };
}

/**
 * Build a field path from components.
 *
 * @example
 * ```ts
 * buildPath('home', 'hero', 'title')
 * // 'home.hero.title'
 *
 * buildPath('home', 'features', '$', 'title')
 * // 'home.features.$.title'
 * ```
 */
export function buildPath(...parts: string[]): string {
  // Check for empty parts first
  for (let i = 0; i < parts.length; i++) {
    if (!parts[i] || parts[i]?.trim() === '') {
      throw new Error(`Path part at index ${i} cannot be empty`);
    }
  }

  if (parts.length < 3) {
    throw new Error('Path must have at least 3 parts (page.section.field)');
  }

  // Validate $ placeholder usage
  const dollarIndices = parts
    .map((part, index) => (part === REPEATER_PLACEHOLDER ? index : -1))
    .filter((i) => i !== -1);

  if (dollarIndices.length > 1) {
    throw new Error('Path can only contain one $ repeater placeholder');
  }

  if (dollarIndices.length === 1 && dollarIndices[0] !== 2) {
    throw new Error('Repeater placeholder $ must be at position 3 (page.section.$)');
  }

  return parts.join(PATH_SEPARATOR);
}

/**
 * Get the page from a field path.
 */
export function getPageFromPath(path: string): string {
  const parsed = parsePath(path);
  return parsed.page;
}

/**
 * Get the section from a field path.
 */
export function getSectionFromPath(path: string): string {
  const parsed = parsePath(path);
  return parsed.section;
}

/**
 * Get the field name from a field path.
 */
export function getFieldFromPath(path: string): string {
  const parsed = parsePath(path);
  return parsed.repeaterField ?? parsed.field;
}

/**
 * Check if a path is a repeater path.
 */
export function isRepeaterPath(path: string): boolean {
  return (
    path.includes(`${PATH_SEPARATOR}${REPEATER_PLACEHOLDER}${PATH_SEPARATOR}`) ||
    path.endsWith(`${PATH_SEPARATOR}${REPEATER_PLACEHOLDER}`)
  );
}

/**
 * Get the parent path (page.section or page.section.$ for repeaters).
 */
export function getParentPath(path: string): string {
  const parts = path.split(PATH_SEPARATOR);
  if (parts.length <= 2) {
    return parts[0] ?? '';
  }
  return parts.slice(0, -1).join(PATH_SEPARATOR);
}

/**
 * Get the page.section path.
 */
export function getPageSectionPath(path: string): string {
  const parsed = parsePath(path);
  return `${parsed.page}${PATH_SEPARATOR}${parsed.section}`;
}

/**
 * Check if a path matches a pattern (supports * wildcard).
 *
 * @example
 * ```ts
 * matchPath('home.hero.title', 'home.*.title') // true
 * matchPath('home.hero.title', 'home.hero.*') // true
 * matchPath('home.hero.title', '*.hero.*') // true
 * ```
 */
export function matchPath(path: string, pattern: string): boolean {
  const pathParts = path.split(PATH_SEPARATOR);
  const patternParts = pattern.split(PATH_SEPARATOR);

  if (pathParts.length !== patternParts.length) {
    return false;
  }

  return patternParts.every((patternPart, index) => {
    if (patternPart === '*') {
      return true;
    }
    return patternPart === pathParts[index];
  });
}

/**
 * Sort paths by page, then section, then field.
 */
export function sortPaths(paths: string[]): string[] {
  return [...paths].sort((a, b) => {
    const parsedA = parsePath(a);
    const parsedB = parsePath(b);

    // Sort by page
    if (parsedA.page !== parsedB.page) {
      return parsedA.page.localeCompare(parsedB.page);
    }

    // Sort by section
    if (parsedA.section !== parsedB.section) {
      return parsedA.section.localeCompare(parsedB.section);
    }

    // Sort by field
    const fieldA = parsedA.repeaterField ?? parsedA.field;
    const fieldB = parsedB.repeaterField ?? parsedB.field;
    return fieldA.localeCompare(fieldB);
  });
}

/**
 * Group paths by page.
 */
export function groupPathsByPage(paths: string[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const path of paths) {
    const page = getPageFromPath(path);
    const existing = grouped.get(page) ?? [];
    existing.push(path);
    grouped.set(page, existing);
  }

  return grouped;
}

/**
 * Group paths by page and section.
 */
export function groupPathsBySection(paths: string[]): Map<string, Map<string, string[]>> {
  const grouped = new Map<string, Map<string, string[]>>();

  for (const path of paths) {
    const parsed = parsePath(path);
    const pageGroup = grouped.get(parsed.page) ?? new Map<string, string[]>();
    const sectionPaths = pageGroup.get(parsed.section) ?? [];
    sectionPaths.push(path);
    pageGroup.set(parsed.section, sectionPaths);
    grouped.set(parsed.page, pageGroup);
  }

  return grouped;
}
