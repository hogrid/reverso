/**
 * Content value type definitions for Reverso CMS.
 * These types represent the actual stored values for each field type.
 */

/**
 * Text field value (text, textarea, email, url, phone).
 */
export type TextValue = string;

/**
 * Number field value (number, range).
 */
export type NumberValue = number;

/**
 * Boolean field value (boolean, checkbox).
 */
export type BooleanValue = boolean;

/**
 * Date/time field values.
 */
export type DateValue = string; // ISO 8601 date string
export type DateTimeValue = string; // ISO 8601 datetime string
export type TimeValue = string; // HH:mm or HH:mm:ss format

/**
 * Select field value.
 */
export type SelectValue = string;

/**
 * Multi-select field value.
 */
export type MultiSelectValue = string[];

/**
 * Checkbox group field value.
 */
export type CheckboxGroupValue = string[];

/**
 * Image field value.
 */
export interface ImageValue {
  /** Image URL or path */
  url: string;
  /** Alt text */
  alt?: string;
  /** Image width in pixels */
  width?: number;
  /** Image height in pixels */
  height?: number;
  /** Focal point for cropping */
  focalPoint?: { x: number; y: number };
  /** Original filename */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
}

/**
 * File field value.
 */
export interface FileValue {
  /** File URL or path */
  url: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
}

/**
 * Gallery field value.
 */
export type GalleryValue = ImageValue[];

/**
 * Video field value.
 */
export interface VideoValue {
  /** Video URL or path */
  url: string;
  /** Poster/thumbnail image */
  poster?: string;
  /** Video width */
  width?: number;
  /** Video height */
  height?: number;
  /** Duration in seconds */
  duration?: number;
  /** Original filename */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
}

/**
 * Audio field value.
 */
export interface AudioValue {
  /** Audio URL or path */
  url: string;
  /** Duration in seconds */
  duration?: number;
  /** Original filename */
  filename?: string;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
}

/**
 * oEmbed field value.
 */
export interface OEmbedValue {
  /** Original URL */
  url: string;
  /** Provider name (YouTube, Vimeo, etc.) */
  provider?: string;
  /** oEmbed HTML */
  html?: string;
  /** Thumbnail URL */
  thumbnail?: string;
  /** Title */
  title?: string;
}

/**
 * Link field value.
 */
export interface LinkValue {
  /** Link URL */
  url: string;
  /** Link text */
  text?: string;
  /** Open in new tab */
  newTab?: boolean;
  /** Rel attribute */
  rel?: string;
}

/**
 * Page link field value.
 */
export interface PageLinkValue {
  /** Page ID or slug */
  page: string;
  /** Link text */
  text?: string;
  /** Anchor/hash */
  anchor?: string;
}

/**
 * Color field value.
 */
export type ColorValue = string; // Hex, RGB, or RGBA string

/**
 * Map/location field value.
 */
export interface MapValue {
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Zoom level */
  zoom?: number;
  /** Address string */
  address?: string;
}

/**
 * Relation field value (single).
 */
export interface RelationValue {
  /** Related content ID */
  id: string;
  /** Related content type */
  type: string;
}

/**
 * Relation field value (multiple).
 */
export type RelationMultiValue = RelationValue[];

/**
 * Taxonomy field value.
 */
export interface TaxonomyValue {
  /** Term ID */
  id: string;
  /** Term slug */
  slug: string;
  /** Term name */
  name: string;
}

/**
 * Taxonomy field value (multiple).
 */
export type TaxonomyMultiValue = TaxonomyValue[];

/**
 * User field value.
 */
export interface UserValue {
  /** User ID */
  id: string;
  /** User email */
  email?: string;
  /** User name */
  name?: string;
  /** User avatar */
  avatar?: string;
}

/**
 * Blocks (Tiptap) field value.
 */
export interface BlocksValue {
  /** Tiptap JSON content */
  content: Record<string, unknown>;
  /** Plain text version */
  text?: string;
  /** HTML version */
  html?: string;
}

/**
 * WYSIWYG field value.
 */
export type WysiwygValue = string; // HTML string

/**
 * Markdown field value.
 */
export type MarkdownValue = string;

/**
 * Code field value.
 */
export interface CodeValue {
  /** Code content */
  code: string;
  /** Language */
  language?: string;
}

/**
 * Repeater field value.
 */
export type RepeaterValue<T = Record<string, ContentValue>> = T[];

/**
 * Flexible content field value.
 */
/**
 * Base content value types (non-recursive).
 */
export type PrimitiveContentValue =
  | TextValue
  | NumberValue
  | BooleanValue
  | DateValue
  | DateTimeValue
  | TimeValue
  | SelectValue
  | MultiSelectValue
  | CheckboxGroupValue
  | ImageValue
  | FileValue
  | GalleryValue
  | VideoValue
  | AudioValue
  | OEmbedValue
  | LinkValue
  | PageLinkValue
  | ColorValue
  | MapValue
  | RelationValue
  | RelationMultiValue
  | TaxonomyValue
  | TaxonomyMultiValue
  | UserValue
  | BlocksValue
  | WysiwygValue
  | MarkdownValue
  | CodeValue
  | null
  | undefined;

/**
 * Flexible content item.
 */
export interface FlexibleItem {
  /** Layout/block type name */
  layout: string;
  /** Layout data */
  data: Record<string, PrimitiveContentValue | PrimitiveContentValue[]>;
}

export type FlexibleValue = FlexibleItem[];

/**
 * Group field value.
 */
export type GroupValue = Record<string, PrimitiveContentValue | PrimitiveContentValue[]>;

/**
 * Union of all possible content values.
 */
export type ContentValue =
  | PrimitiveContentValue
  | RepeaterValue<Record<string, PrimitiveContentValue>>
  | FlexibleValue
  | GroupValue;

/**
 * Content for a page (all sections and fields).
 */
export interface PageContent {
  /** Page slug */
  slug: string;
  /** Content data organized by section.field */
  data: Record<string, Record<string, ContentValue>>;
  /** Last updated timestamp */
  updatedAt: string;
  /** User who last updated */
  updatedBy?: string;
}

/**
 * Content for a section (all fields).
 */
export interface SectionContent {
  /** Section slug */
  slug: string;
  /** Field values */
  fields: Record<string, ContentValue>;
}
