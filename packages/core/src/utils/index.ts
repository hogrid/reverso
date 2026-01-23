/**
 * Utility exports for @reverso/core
 */

// Path utilities
export {
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
} from './path.js';

// Naming utilities
export {
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
} from './naming.js';

// Validation utilities
export {
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
} from './validation.js';
