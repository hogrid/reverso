/**
 * Output exports for @reverso/scanner
 */

export {
  writeJsonSchema,
  readJsonSchema,
  compareSchemas,
  formatSchemaDiff,
  type JsonWriterOptions,
} from './json-writer.js';

export {
  generateTypeDefinitions,
  writeTypesFile,
  type TypesWriterOptions,
} from './types-writer.js';
