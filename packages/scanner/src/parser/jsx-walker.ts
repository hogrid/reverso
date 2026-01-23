/**
 * Walks through JSX elements in a source file to find data-reverso markers.
 */

import type { DetectedField } from '@reverso/core';
import {
  type JsxOpeningElement,
  type JsxSelfClosingElement,
  type SourceFile,
  SyntaxKind,
} from 'ts-morph';
import {
  extractAttributes,
  getElementTextContent,
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

  // Get all JSX opening elements
  const openingElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  for (const element of openingElements) {
    const field = processElement(element, filePath, options);
    if (field) {
      fields.push(field);
    }
  }

  // Get all self-closing JSX elements
  const selfClosingElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  for (const element of selfClosingElements) {
    const field = processElement(element, filePath, options);
    if (field) {
      fields.push(field);
    }
  }

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

  // Get text content if requested
  if (options.includeTextContent !== false) {
    const textContent = getElementTextContent(element);
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
