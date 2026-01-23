/**
 * Schema exports for @reverso/scanner
 */

export {
  generateSchema,
  convertToFieldSchema,
  updateSchemaMeta,
} from './generator.js';

export {
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
} from './normalizer.js';
