/**
 * Type exports for @reverso/core
 */

// Field types
export type {
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
} from './fields.js';

// Schema types
export type {
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
} from './schema.js';

// Config types
export type {
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
} from './config.js';

// Content types
export type {
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
} from './content.js';
