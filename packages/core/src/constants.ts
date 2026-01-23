/**
 * Constants for Reverso CMS.
 */

/**
 * Current version of the schema format.
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Default configuration file names (in order of priority).
 */
export const CONFIG_FILE_NAMES = [
  'reverso.config.ts',
  'reverso.config.js',
  'reverso.config.mjs',
] as const;

/**
 * Default output directory for generated files.
 */
export const DEFAULT_OUTPUT_DIR = '.reverso';

/**
 * Default source directory to scan.
 */
export const DEFAULT_SRC_DIR = 'src';

/**
 * Default file patterns to include in scanning.
 */
export const DEFAULT_INCLUDE_PATTERNS = ['**/*.tsx', '**/*.jsx'] as const;

/**
 * Default file patterns to exclude from scanning.
 */
export const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/.reverso/**',
  '**/*.test.tsx',
  '**/*.test.jsx',
  '**/*.spec.tsx',
  '**/*.spec.jsx',
  '**/*.stories.tsx',
  '**/*.stories.jsx',
] as const;

/**
 * The main attribute for marking content fields.
 */
export const MARKER_ATTRIBUTE = 'data-reverso';

/**
 * Prefix for all data-reverso-* attributes.
 */
export const MARKER_PREFIX = 'data-reverso-';

/**
 * All valid marker attributes.
 */
export const VALID_ATTRIBUTES = [
  'data-reverso',
  'data-reverso-type',
  'data-reverso-label',
  'data-reverso-placeholder',
  'data-reverso-required',
  'data-reverso-validation',
  'data-reverso-options',
  'data-reverso-condition',
  'data-reverso-default',
  'data-reverso-help',
  'data-reverso-min',
  'data-reverso-max',
  'data-reverso-step',
  'data-reverso-accept',
  'data-reverso-multiple',
  'data-reverso-rows',
  'data-reverso-width',
  'data-reverso-readonly',
  'data-reverso-hidden',
] as const;

/**
 * Schema output file name.
 */
export const SCHEMA_FILE_NAME = 'schema.json';

/**
 * TypeScript types output file name.
 */
export const TYPES_FILE_NAME = 'types.ts';

/**
 * Default admin panel port in development.
 */
export const DEFAULT_DEV_PORT = 4000;

/**
 * Default API path.
 */
export const DEFAULT_API_PATH = '/api/reverso';

/**
 * Default admin path.
 */
export const DEFAULT_ADMIN_PATH = '/admin';

/**
 * Repeater item placeholder in paths.
 */
export const REPEATER_PLACEHOLDER = '$';

/**
 * Path separator for field paths.
 */
export const PATH_SEPARATOR = '.';

/**
 * Default field type when not specified.
 */
export const DEFAULT_FIELD_TYPE = 'text';

/**
 * Maximum file size for uploads (50MB).
 */
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Default session duration (7 days in seconds).
 */
export const DEFAULT_SESSION_DURATION = 7 * 24 * 60 * 60;

/**
 * Watch mode debounce delay in milliseconds.
 */
export const DEFAULT_WATCH_DEBOUNCE = 300;
