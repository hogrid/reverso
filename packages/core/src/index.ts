/**
 * @reverso/core
 *
 * Core types, utilities, and configuration system for Reverso CMS.
 * This package provides the foundational types and utilities used across all Reverso packages.
 *
 * @example
 * ```ts
 * import { defineConfig, parsePath, formatLabel, FieldType } from '@reverso/core';
 *
 * // Define configuration
 * export default defineConfig({
 *   database: {
 *     provider: 'sqlite',
 *     url: '.reverso/dev.db',
 *   },
 * });
 *
 * // Use utilities
 * const parsed = parsePath('home.hero.title');
 * const label = formatLabel('hero_title'); // 'Hero Title'
 * ```
 */

export const VERSION = '0.0.0';

// Type exports
export type {
  // Field types
  FieldType,
  FieldAttributes,
  FieldSchema,
  FieldConfig,
  SelectFieldConfig,
  ImageFieldConfig,
  FileFieldConfig,
  RelationFieldConfig,
  TaxonomyFieldConfig,
  RepeaterFieldConfig,
  FlexibleFieldConfig,
  BlocksFieldConfig,
  CodeFieldConfig,
  MapFieldConfig,
  // Schema types
  ParsedPath,
  SectionSchema,
  PageSchema,
  ProjectSchema,
  SchemaDiff,
  SchemaGeneratorOptions,
  DetectedField,
  FileScanResult,
  ScanError,
  ScanOptions,
  ScanResult,
  // Config types
  DatabaseConfig,
  SqliteDatabaseConfig,
  PostgresDatabaseConfig,
  AuthConfig,
  OAuthProviderConfig,
  UploadsConfig,
  S3Config,
  CloudinaryConfig,
  UploadThingConfig,
  AdminConfig,
  ApiConfig,
  CorsConfig,
  RateLimitConfig,
  ScannerConfig,
  PluginConfig,
  HooksConfig,
  ReversoConfig,
  ResolvedConfig,
  // Content types
  TextValue,
  NumberValue,
  BooleanValue,
  DateValue,
  DateTimeValue,
  TimeValue,
  SelectValue,
  MultiSelectValue,
  CheckboxGroupValue,
  ImageValue,
  FileValue,
  GalleryValue,
  VideoValue,
  AudioValue,
  OEmbedValue,
  LinkValue,
  PageLinkValue,
  ColorValue,
  MapValue,
  RelationValue,
  RelationMultiValue,
  TaxonomyValue,
  TaxonomyMultiValue,
  UserValue,
  BlocksValue,
  WysiwygValue,
  MarkdownValue,
  CodeValue,
  RepeaterValue,
  PrimitiveContentValue,
  FlexibleItem,
  FlexibleValue,
  GroupValue,
  ContentValue,
  PageContent,
  SectionContent,
} from './types/index.js';

// Config exports
export {
  defineConfig,
  configPartial,
  defaultConfig,
  defaultDatabaseConfig,
  defaultScannerConfig,
  defaultAdminConfig,
  defaultApiConfig,
  defaultDevConfig,
  mergeWithDefaults,
  loadConfig,
  loadConfigSync,
  findConfigFile,
  configSchema,
  databaseConfigSchema,
  authConfigSchema,
  uploadsConfigSchema,
  adminConfigSchema,
  apiConfigSchema,
  scannerConfigSchema,
  pluginConfigSchema,
  hooksConfigSchema,
  devConfigSchema,
  type LoadConfigOptions,
  type LoadConfigResult,
  type ValidatedConfig,
} from './config/index.js';

// Utility exports
export {
  // Path utilities
  parsePath,
  buildPath,
  getPageFromPath,
  getSectionFromPath,
  getFieldFromPath,
  isRepeaterPath,
  getParentPath,
  getPageSectionPath,
  matchPath,
  sortPaths,
  groupPathsByPage,
  groupPathsBySection,
  // Naming utilities
  formatLabel,
  slugify,
  camelCase,
  pascalCase,
  snakeCase,
  constantCase,
  kebabCase,
  pluralize,
  singularize,
  truncate,
  toIdentifier,
  // Validation utilities
  FIELD_TYPES,
  fieldTypeSchema,
  fieldPathSchema,
  fieldAttributesSchema,
  fieldSchema,
  isValidFieldType,
  isValidFieldPath,
  validateFieldAttributes,
  validateFieldSchema,
  isValidAttribute,
  extractAttributeName,
  parseOptions,
  parseCondition,
} from './utils/index.js';

// Constants exports
export {
  SCHEMA_VERSION,
  CONFIG_FILE_NAMES,
  DEFAULT_OUTPUT_DIR,
  DEFAULT_SRC_DIR,
  DEFAULT_INCLUDE_PATTERNS,
  DEFAULT_EXCLUDE_PATTERNS,
  MARKER_ATTRIBUTE,
  MARKER_PREFIX,
  VALID_ATTRIBUTES,
  SCHEMA_FILE_NAME,
  TYPES_FILE_NAME,
  DEFAULT_DEV_PORT,
  DEFAULT_API_PATH,
  DEFAULT_ADMIN_PATH,
  REPEATER_PLACEHOLDER,
  PATH_SEPARATOR,
  DEFAULT_FIELD_TYPE,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_SESSION_DURATION,
  DEFAULT_WATCH_DEBOUNCE,
} from './constants.js';
