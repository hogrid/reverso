/**
 * Schema type definitions for pages and sections.
 * Represents the hierarchical structure: Page > Section > Field
 */

import type { FieldSchema, FieldType } from './fields.js';

/**
 * Path components extracted from a field path like "home.hero.title"
 */
export interface ParsedPath {
  /** Page slug (e.g., "home") */
  page: string;
  /** Section slug (e.g., "hero") */
  section: string;
  /** Field name (e.g., "title") */
  field: string;
  /** Whether this is a repeater item (contains $) */
  isRepeater: boolean;
  /** Repeater item field (if applicable) */
  repeaterField?: string;
  /** Full original path */
  full: string;
}

/**
 * Schema for a section within a page.
 */
export interface SectionSchema {
  /** Section slug (e.g., "hero") */
  slug: string;
  /** Human-readable name (e.g., "Hero Section") */
  name: string;
  /** Fields within this section */
  fields: FieldSchema[];
  /** Whether this section contains a repeater */
  isRepeater: boolean;
  /** Repeater configuration if applicable */
  repeaterConfig?: {
    min?: number;
    max?: number;
    itemLabel?: string;
  };
  /** Order of this section (for sorting) */
  order: number;
}

/**
 * Schema for a page.
 */
export interface PageSchema {
  /** Page slug (e.g., "home") */
  slug: string;
  /** Human-readable name (e.g., "Home Page") */
  name: string;
  /** Sections within this page */
  sections: SectionSchema[];
  /** Total field count across all sections */
  fieldCount: number;
  /** Source files containing this page's fields */
  sourceFiles: string[];
}

/**
 * Complete schema for the entire project.
 */
export interface ProjectSchema {
  /** Schema version for compatibility checks */
  version: string;
  /** When the schema was generated */
  generatedAt: string;
  /** All pages in the project */
  pages: PageSchema[];
  /** Total page count */
  pageCount: number;
  /** Total field count */
  totalFields: number;
  /** Metadata about the scan */
  meta: {
    /** Source directory that was scanned */
    srcDir: string;
    /** Files that were scanned */
    filesScanned: number;
    /** Files that contained markers */
    filesWithMarkers: number;
    /** Scan duration in milliseconds */
    scanDuration: number;
  };
}

/**
 * Result of a schema diff operation.
 */
export interface SchemaDiff {
  /** Fields that were added */
  added: FieldSchema[];
  /** Fields that were removed */
  removed: FieldSchema[];
  /** Fields that were modified */
  modified: Array<{
    path: string;
    before: FieldSchema;
    after: FieldSchema;
    changes: string[];
  }>;
  /** Whether there are any changes */
  hasChanges: boolean;
}

/**
 * Options for schema generation.
 */
export interface SchemaGeneratorOptions {
  /** Include source file information */
  includeSourceInfo?: boolean;
  /** Include default content from JSX */
  includeDefaults?: boolean;
  /** Sort pages/sections/fields alphabetically */
  sort?: boolean;
  /** Default field type when not specified */
  defaultFieldType?: FieldType;
}

/**
 * A raw field detection before full schema generation.
 */
export interface DetectedField {
  /** The data-reverso attribute value */
  path: string;
  /** All data-reverso-* attributes */
  attributes: Record<string, string | undefined>;
  /** Source file path */
  file: string;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
  /** JSX element tag name */
  element: string;
  /** Text content of the element */
  textContent?: string;
}

/**
 * Result of scanning a single file.
 */
export interface FileScanResult {
  /** File path */
  file: string;
  /** Detected fields */
  fields: DetectedField[];
  /** Any errors encountered */
  errors: ScanError[];
  /** Scan duration for this file in milliseconds */
  duration: number;
}

/**
 * Error encountered during scanning.
 */
export interface ScanError {
  /** Error type */
  type: 'parse' | 'validation' | 'io';
  /** Error message */
  message: string;
  /** File path (if applicable) */
  file?: string;
  /** Line number (if applicable) */
  line?: number;
  /** Column number (if applicable) */
  column?: number;
}

/**
 * Options for the scan operation.
 */
export interface ScanOptions {
  /** Directory to scan */
  srcDir: string;
  /** Glob patterns to include */
  include?: string[];
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Watch for changes */
  watch?: boolean;
  /** Verbose logging */
  verbose?: boolean;
  /** Fail on errors instead of continuing */
  strict?: boolean;
}

/**
 * Result of a complete scan operation.
 */
export interface ScanResult {
  /** Generated schema */
  schema: ProjectSchema;
  /** Individual file results */
  files: FileScanResult[];
  /** All errors encountered */
  errors: ScanError[];
  /** Whether the scan was successful */
  success: boolean;
}
