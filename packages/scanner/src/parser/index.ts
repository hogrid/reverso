/**
 * Parser exports for @reverso/scanner
 */

export {
  AstParser,
  createParser,
  type AstParserOptions,
  type ParseResult,
} from './ast-parser.js';

export {
  walkJsxElements,
  getUniquePaths,
  groupFieldsByPath,
  findDuplicatePaths,
  type JsxWalkerOptions,
} from './jsx-walker.js';

export {
  hasReversoMarker,
  extractAttributes,
  getElementTextContent,
  type ExtractedAttributes,
} from './attribute-extractor.js';
