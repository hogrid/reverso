/**
 * @reverso/scanner
 *
 * AST parser for detecting data-reverso markers in React/Next.js code.
 * Uses ts-morph to parse TypeScript/JSX and extract field definitions.
 *
 * @example
 * ```ts
 * import { createScanner, scan } from '@reverso/scanner';
 *
 * // One-time scan
 * const result = await scan({
 *   srcDir: './src',
 * });
 *
 * console.log(`Found ${result.schema.totalFields} fields`);
 *
 * // Watch mode
 * const scanner = createScanner({
 *   srcDir: './src',
 *   outputDir: '.reverso',
 *   watch: true,
 * });
 *
 * scanner.on((event) => {
 *   if (event.type === 'complete') {
 *     console.log('Schema updated:', event.schema);
 *   }
 * });
 *
 * await scanner.startWatch();
 * ```
 */

/** Package version, read from package.json so it always matches the release. */
import { readFileSync } from 'node:fs';

export const VERSION: string = (() => {
  try {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    ) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

// Main scanner exports
export {
  Scanner,
  createScanner,
  scan,
  type ScannerOptions,
  type ScanEventType,
  type ScanEvent,
  type ScanEventHandler,
} from './scanner.js';

// Parser exports
export {
  AstParser,
  createParser,
  walkJsxElements,
  getUniquePaths,
  groupFieldsByPath,
  findDuplicatePaths,
  hasReversoMarker,
  extractAttributes,
  getElementTextContent,
  type AstParserOptions,
  type ParseResult,
  type JsxWalkerOptions,
  type ExtractedAttributes,
} from './parser/index.js';

// Schema exports
export {
  generateSchema,
  convertToFieldSchema,
  updateSchemaMeta,
  normalizeFieldPath,
  normalizeFields,
  sortSectionFields,
  sortPageSections,
  sortSchemaPages,
  ensureLabels,
  deduplicateFields,
  mergeFields,
  reorderSections,
  validateSchemaStructure,
} from './schema/index.js';

// Output exports
export {
  writeJsonSchema,
  readJsonSchema,
  compareSchemas,
  formatSchemaDiff,
  generateTypeDefinitions,
  writeTypesFile,
  type JsonWriterOptions,
  type TypesWriterOptions,
} from './output/index.js';

// Watch exports
export {
  FileWatcher,
  createWatcher,
  type WatchEventType,
  type WatchEvent,
  type WatchEventHandler,
  type WatcherOptions,
} from './watch/index.js';
