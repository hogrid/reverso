/**
 * Naming utilities for converting between different naming conventions.
 */

/**
 * Convert a slug or identifier to a human-readable label.
 *
 * @example
 * ```ts
 * formatLabel('hero_title') // 'Hero Title'
 * formatLabel('heroTitle') // 'Hero Title'
 * formatLabel('hero-title') // 'Hero Title'
 * formatLabel('HeroTitle') // 'Hero Title'
 * ```
 */
export function formatLabel(input: string): string {
  return (
    input
      // Insert space before uppercase letters in camelCase/PascalCase
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Replace underscores and hyphens with spaces
      .replace(/[_-]/g, ' ')
      // Capitalize first letter of each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Convert a string to a URL-safe slug.
 *
 * @example
 * ```ts
 * slugify('Hero Title') // 'hero-title'
 * slugify('Hello World!') // 'hello-world'
 * slugify('café') // 'cafe'
 * ```
 */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      // Normalize unicode characters and remove diacritical marks
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: Valid pattern for combining diacritical marks
      .replace(/[\u0300-\u036f]/g, '')
      // Replace non-alphanumeric with hyphens
      .replace(/[^a-z0-9]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Remove duplicate hyphens
      .replace(/-+/g, '-')
  );
}

/**
 * Convert a string to camelCase.
 *
 * @example
 * ```ts
 * camelCase('hero-title') // 'heroTitle'
 * camelCase('Hero Title') // 'heroTitle'
 * camelCase('HERO_TITLE') // 'heroTitle'
 * ```
 */
export function camelCase(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, char: string) => char.toUpperCase());
}

/**
 * Convert a string to PascalCase.
 *
 * @example
 * ```ts
 * pascalCase('hero-title') // 'HeroTitle'
 * pascalCase('hero title') // 'HeroTitle'
 * pascalCase('heroTitle') // 'HeroTitle'
 * ```
 */
export function pascalCase(input: string): string {
  const camel = camelCase(input);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert a string to snake_case.
 *
 * @example
 * ```ts
 * snakeCase('heroTitle') // 'hero_title'
 * snakeCase('Hero Title') // 'hero_title'
 * snakeCase('hero-title') // 'hero_title'
 * ```
 */
export function snakeCase(input: string): string {
  return (
    input
      // Insert underscore before uppercase letters
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .toLowerCase()
      // Replace non-alphanumeric with underscores
      .replace(/[^a-z0-9]+/g, '_')
      // Remove leading/trailing underscores
      .replace(/^_+|_+$/g, '')
      // Remove duplicate underscores
      .replace(/_+/g, '_')
  );
}

/**
 * Convert a string to CONSTANT_CASE.
 *
 * @example
 * ```ts
 * constantCase('heroTitle') // 'HERO_TITLE'
 * constantCase('hero-title') // 'HERO_TITLE'
 * ```
 */
export function constantCase(input: string): string {
  return snakeCase(input).toUpperCase();
}

/**
 * Convert a string to kebab-case.
 *
 * @example
 * ```ts
 * kebabCase('heroTitle') // 'hero-title'
 * kebabCase('Hero Title') // 'hero-title'
 * ```
 */
export function kebabCase(input: string): string {
  return snakeCase(input).replace(/_/g, '-');
}

/**
 * Pluralize a word (simple English rules).
 *
 * @example
 * ```ts
 * pluralize('item') // 'items'
 * pluralize('category') // 'categories'
 * pluralize('status') // 'statuses'
 * ```
 */
export function pluralize(word: string): string {
  const lower = word.toLowerCase();

  // Irregular plurals
  const irregulars: Record<string, string> = {
    child: 'children',
    person: 'people',
    man: 'men',
    woman: 'women',
    foot: 'feet',
    tooth: 'teeth',
    goose: 'geese',
    mouse: 'mice',
  };

  if (irregulars[lower]) {
    // Preserve original case
    if (word[0] === word[0]?.toUpperCase()) {
      const plural = irregulars[lower];
      return (plural?.[0]?.toUpperCase() ?? '') + (plural?.slice(1) ?? '');
    }
    return irregulars[lower] ?? word;
  }

  // Words ending in -s, -x, -z, -ch, -sh
  if (/(?:s|x|z|ch|sh)$/i.test(word)) {
    return `${word}es`;
  }

  // Words ending in consonant + y
  if (/[^aeiou]y$/i.test(word)) {
    return `${word.slice(0, -1)}ies`;
  }

  // Words ending in -f or -fe
  if (/(?:f|fe)$/i.test(word)) {
    return word.replace(/(?:f|fe)$/i, 'ves');
  }

  // Default: add -s
  return `${word}s`;
}

/**
 * Singularize a word (simple English rules).
 *
 * @example
 * ```ts
 * singularize('items') // 'item'
 * singularize('categories') // 'category'
 * ```
 */
export function singularize(word: string): string {
  const lower = word.toLowerCase();

  // Irregular singulars
  const irregulars: Record<string, string> = {
    children: 'child',
    people: 'person',
    men: 'man',
    women: 'woman',
    feet: 'foot',
    teeth: 'tooth',
    geese: 'goose',
    mice: 'mouse',
  };

  if (irregulars[lower]) {
    if (word[0] === word[0]?.toUpperCase()) {
      const singular = irregulars[lower];
      return (singular?.[0]?.toUpperCase() ?? '') + (singular?.slice(1) ?? '');
    }
    return irregulars[lower] ?? word;
  }

  // Words ending in -ies
  if (/ies$/i.test(word)) {
    return `${word.slice(0, -3)}y`;
  }

  // Words ending in -ves
  if (/ves$/i.test(word)) {
    return `${word.slice(0, -3)}f`;
  }

  // Words ending in -es (for -s, -x, -z, -ch, -sh)
  if (/(?:s|x|z|ch|sh)es$/i.test(word)) {
    return word.slice(0, -2);
  }

  // Words ending in -s
  if (/s$/i.test(word) && !/ss$/i.test(word)) {
    return word.slice(0, -1);
  }

  return word;
}

/**
 * Truncate a string to a maximum length.
 *
 * @example
 * ```ts
 * truncate('Hello World', 8) // 'Hello...'
 * truncate('Hello', 10) // 'Hello'
 * ```
 */
export function truncate(input: string, maxLength: number, suffix = '...'): string {
  if (input.length <= maxLength) {
    return input;
  }
  return input.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Generate a safe TypeScript identifier from a string.
 *
 * @example
 * ```ts
 * toIdentifier('hero-title') // 'heroTitle'
 * toIdentifier('123start') // '_123start'
 * toIdentifier('class') // '_class'
 * ```
 */
export function toIdentifier(input: string): string {
  // Reserved words that cannot be used as identifiers
  const reserved = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'enum',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'yield',
    'let',
    'static',
    'implements',
    'interface',
    'package',
    'private',
    'protected',
    'public',
  ]);

  let identifier = camelCase(input);

  // Prefix with underscore if starts with number
  if (/^\d/.test(identifier)) {
    identifier = `_${identifier}`;
  }

  // Prefix with underscore if reserved word
  if (reserved.has(identifier)) {
    identifier = `_${identifier}`;
  }

  return identifier;
}
