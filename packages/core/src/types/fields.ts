/**
 * Field type definitions for Reverso CMS.
 * 35+ field types covering all common content management needs.
 */

/**
 * All supported field types in Reverso CMS.
 *
 * Categories:
 * - Text: text, textarea, number, range, email, url, phone
 * - Rich Content: wysiwyg, markdown, code, blocks
 * - Selection: select, multiselect, checkbox, checkboxgroup, radio, boolean
 * - Media: image, file, gallery, video, audio, oembed
 * - Date/Time: date, datetime, time
 * - Relationships: relation, taxonomy, link, pagelink, user
 * - Advanced: color, map, repeater, group, flexible
 * - UI: message, tab, accordion, buttongroup
 */
export type FieldType =
  // Text inputs
  | 'text'
  | 'textarea'
  | 'number'
  | 'range'
  | 'email'
  | 'url'
  | 'phone'
  // Rich content
  | 'wysiwyg'
  | 'markdown'
  | 'code'
  | 'blocks'
  // Selection
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'checkboxgroup'
  | 'radio'
  | 'boolean'
  // Media
  | 'image'
  | 'file'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'oembed'
  // Date/Time
  | 'date'
  | 'datetime'
  | 'time'
  // Relationships
  | 'relation'
  | 'taxonomy'
  | 'link'
  | 'pagelink'
  | 'user'
  // Advanced
  | 'color'
  | 'map'
  | 'repeater'
  | 'group'
  | 'flexible'
  // UI helpers
  | 'message'
  | 'tab'
  | 'accordion'
  | 'buttongroup';

/**
 * Common field attributes extracted from data-reverso-* markers.
 */
export interface FieldAttributes {
  /** Field type (defaults to 'text') */
  type?: FieldType;
  /** Human-readable label */
  label?: string;
  /** Placeholder text for inputs */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Zod validation schema as string */
  validation?: string;
  /** Options for select/radio/checkbox fields (JSON string or comma-separated) */
  options?: string;
  /** Conditional display logic */
  condition?: string;
  /** Default value */
  default?: string;
  /** Help text shown below field */
  help?: string;
  /** Minimum value (for number/range) or min length (for text) */
  min?: number;
  /** Maximum value (for number/range) or max length (for text) */
  max?: number;
  /** Step value for number/range inputs */
  step?: number;
  /** Accepted file types (for file/image fields) */
  accept?: string;
  /** Allow multiple values */
  multiple?: boolean;
  /** Number of rows (for textarea) */
  rows?: number;
  /** Width in grid columns (1-12) */
  width?: number;
  /** Make field read-only */
  readonly?: boolean;
  /** Hide field in admin panel */
  hidden?: boolean;
}

/**
 * Full schema for a detected field, including source location.
 */
export interface FieldSchema extends FieldAttributes {
  /** Full path: page.section.field or page.section.$.field for repeaters */
  path: string;
  /** Resolved field type (defaults to 'text' if not specified) */
  type: FieldType;
  /** Source file path */
  file: string;
  /** Line number in source file */
  line: number;
  /** Column number in source file */
  column: number;
  /** Raw JSX element tag name */
  element?: string;
  /** Original default content from JSX children */
  defaultContent?: string;
}

/**
 * Type-specific configurations for different field types.
 */

/** Configuration for select/multiselect/radio/checkbox fields */
export interface SelectFieldConfig {
  type: 'select' | 'multiselect' | 'radio' | 'checkboxgroup';
  options: Array<{
    label: string;
    value: string;
    disabled?: boolean;
  }>;
  allowCustom?: boolean;
}

/** Configuration for image fields */
export interface ImageFieldConfig {
  type: 'image';
  accept?: string;
  maxSize?: number;
  aspectRatio?: string;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

/** Configuration for file fields */
export interface FileFieldConfig {
  type: 'file';
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
}

/** Configuration for relation fields */
export interface RelationFieldConfig {
  type: 'relation';
  /** Related content type */
  to: string;
  /** Allow multiple selections */
  multiple?: boolean;
  /** Fields to display in picker */
  displayFields?: string[];
}

/** Configuration for taxonomy fields */
export interface TaxonomyFieldConfig {
  type: 'taxonomy';
  /** Taxonomy slug */
  taxonomy: string;
  /** Allow creating new terms */
  allowCreate?: boolean;
  /** Allow multiple selections */
  multiple?: boolean;
}

/** Configuration for repeater fields */
export interface RepeaterFieldConfig {
  type: 'repeater';
  /** Minimum number of items */
  min?: number;
  /** Maximum number of items */
  max?: number;
  /** Fields within each item */
  fields: FieldSchema[];
  /** Layout: 'block' | 'table' | 'accordion' */
  layout?: 'block' | 'table' | 'accordion';
}

/** Configuration for flexible content fields */
export interface FlexibleFieldConfig {
  type: 'flexible';
  /** Available layouts/blocks */
  layouts: Array<{
    name: string;
    label: string;
    fields: FieldSchema[];
  }>;
  min?: number;
  max?: number;
}

/** Configuration for blocks (Tiptap-based) fields */
export interface BlocksFieldConfig {
  type: 'blocks';
  /** Allowed block types */
  blocks?: string[];
  /** Toolbar configuration */
  toolbar?: string[];
}

/** Configuration for code fields */
export interface CodeFieldConfig {
  type: 'code';
  /** Language for syntax highlighting */
  language?: string;
  /** Show line numbers */
  lineNumbers?: boolean;
}

/** Configuration for map fields */
export interface MapFieldConfig {
  type: 'map';
  /** Default center coordinates */
  center?: { lat: number; lng: number };
  /** Default zoom level */
  zoom?: number;
  /** Map provider */
  provider?: 'google' | 'mapbox' | 'leaflet';
}

/**
 * Union of all field-specific configurations.
 */
export type FieldConfig =
  | SelectFieldConfig
  | ImageFieldConfig
  | FileFieldConfig
  | RelationFieldConfig
  | TaxonomyFieldConfig
  | RepeaterFieldConfig
  | FlexibleFieldConfig
  | BlocksFieldConfig
  | CodeFieldConfig
  | MapFieldConfig;
