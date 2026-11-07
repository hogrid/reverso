/**
 * Walks through JSX elements in a source file to find data-reverso markers.
 */

import type { DetectedField } from '@reverso/core';
import {
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  type Node,
  type SourceFile,
  SyntaxKind,
} from 'ts-morph';
import {
  extractAttributes,
  getElementDefaultContent,
  hasReversoMarker,
} from './attribute-extractor.js';

/**
 * Options for walking JSX elements.
 */
export interface JsxWalkerOptions {
  /** Include the element tag name */
  includeElement?: boolean;
  /** Include text content as default */
  includeTextContent?: boolean;
}

/**
 * Walk through all JSX elements in a source file and detect fields.
 */
export function walkJsxElements(
  sourceFile: SourceFile,
  options: JsxWalkerOptions = {}
): DetectedField[] {
  const fields: DetectedField[] = [];
  const filePath = sourceFile.getFilePath();

  // Visit opening and self-closing elements in document order, so fields
  // keep the order they appear in the source.
  sourceFile.forEachDescendant((node: Node) => {
    const kind = node.getKind();
    if (kind !== SyntaxKind.JsxOpeningElement && kind !== SyntaxKind.JsxSelfClosingElement) {
      return;
    }
    const field = processElement(
      node as JsxOpeningElement | JsxSelfClosingElement,
      filePath,
      options
    );
    if (field) {
      fields.push(field);
    }
  });

  return fields;
}

/**
 * Process a single JSX element and extract field data.
 */
function processElement(
  element: JsxOpeningElement | JsxSelfClosingElement,
  filePath: string,
  options: JsxWalkerOptions
): DetectedField | null {
  // Check if element has the data-reverso marker
  if (!hasReversoMarker(element)) {
    return null;
  }

  // Extract attributes
  const extracted = extractAttributes(element);
  if (!extracted) {
    // The marker is there but its path is not a static string (a variable,
    // a template literal with substitutions, an empty string). It cannot be
    // turned into a field, so say so instead of dropping it silently.
    const marker = element.getAttribute('data-reverso');
    // biome-ignore lint/suspicious/noConsole: scanner diagnostics are reported on the console
    console.warn(
      `⚠ Skipped data-reverso marker with a dynamic or empty path at ${filePath}:${element.getStartLineNumber()}` +
        (marker ? ` (${marker.getText()})` : '') +
        ' — markers must be string literals like data-reverso="page.section.field".'
    );
    return null;
  }

  // Get position info
  const startLineNumber = element.getStartLineNumber();
  const startLinePos = element.getStartLinePos();
  const start = element.getStart();
  const column = start - startLinePos;

  // Get element tag name
  const tagName = element.getTagNameNode().getText();

  // Build the field object
  const field: DetectedField = {
    path: extracted.path,
    attributes: extracted.raw as Record<string, string | undefined>,
    file: filePath,
    line: startLineNumber,
    column,
    element: tagName,
  };

  // Get the default content (text, .get() fallback, img src, link href)
  if (options.includeTextContent !== false) {
    const textContent = getElementDefaultContent(element);
    if (textContent) {
      field.textContent = textContent;
    }
  }

  return field;
}

/**
 * Find all unique paths in a list of detected fields.
 */
export function getUniquePaths(fields: DetectedField[]): string[] {
  const paths = new Set<string>();
  for (const field of fields) {
    paths.add(field.path);
  }
  return Array.from(paths).sort();
}

/**
 * Group fields by their path.
 */
export function groupFieldsByPath(fields: DetectedField[]): Map<string, DetectedField[]> {
  const grouped = new Map<string, DetectedField[]>();

  for (const field of fields) {
    const existing = grouped.get(field.path) ?? [];
    existing.push(field);
    grouped.set(field.path, existing);
  }

  return grouped;
}

/**
 * Check for duplicate paths (same path in multiple places).
 */
export function findDuplicatePaths(fields: DetectedField[]): Map<string, DetectedField[]> {
  const grouped = groupFieldsByPath(fields);
  const duplicates = new Map<string, DetectedField[]>();

  for (const [path, pathFields] of grouped) {
    if (pathFields.length > 1) {
      duplicates.set(path, pathFields);
    }
  }

  return duplicates;
}
