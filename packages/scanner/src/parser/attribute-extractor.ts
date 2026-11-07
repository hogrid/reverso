/**
 * Extracts data-reverso-* attributes from JSX elements.
 */

import { type FieldAttributes, MARKER_ATTRIBUTE, MARKER_PREFIX } from '@reverso/core';
import type {
  CallExpression,
  JsxAttribute,
  JsxExpression,
  JsxOpeningElement,
  JsxSelfClosingElement,
  Node,
} from 'ts-morph';
import { SyntaxKind } from 'ts-morph';

/**
 * Result of extracting attributes from a JSX element.
 */
export interface ExtractedAttributes {
  /** The data-reverso path value */
  path: string;
  /** All extracted attributes */
  attributes: Partial<FieldAttributes>;
  /** Raw attribute map */
  raw: Record<string, string | undefined>;
}

/**
 * Check if a JSX element has the data-reverso attribute.
 */
export function hasReversoMarker(element: JsxOpeningElement | JsxSelfClosingElement): boolean {
  const attributes = element.getAttributes();
  return attributes.some((attr) => {
    if (attr.getKind() === SyntaxKind.JsxAttribute) {
      const jsxAttr = attr as JsxAttribute;
      const name = jsxAttr.getNameNode().getText();
      return name === MARKER_ATTRIBUTE;
    }
    return false;
  });
}

/**
 * Extract all data-reverso-* attributes from a JSX element.
 */
export function extractAttributes(
  element: JsxOpeningElement | JsxSelfClosingElement
): ExtractedAttributes | null {
  const attributes = element.getAttributes();
  const raw: Record<string, string | undefined> = {};
  let path: string | undefined;

  for (const attr of attributes) {
    // Skip spread attributes
    if (attr.getKind() === SyntaxKind.JsxSpreadAttribute) {
      continue;
    }

    const jsxAttr = attr as JsxAttribute;
    const name = jsxAttr.getNameNode().getText();

    // Check for data-reverso or data-reverso-* attributes
    if (name === MARKER_ATTRIBUTE) {
      path = getAttributeValue(jsxAttr);
    } else if (name.startsWith(MARKER_PREFIX)) {
      const key = name.slice(MARKER_PREFIX.length);
      raw[key] = getAttributeValue(jsxAttr);
    }
  }

  if (!path) {
    return null;
  }

  // Convert raw attributes to typed FieldAttributes
  const fieldAttrs = parseFieldAttributes(raw);

  return {
    path,
    attributes: fieldAttrs,
    raw,
  };
}

/**
 * Get the value of a JSX attribute.
 */
function getAttributeValue(attr: JsxAttribute): string | undefined {
  const initializer = attr.getInitializer();

  if (!initializer) {
    // Boolean attribute like data-reverso-required
    return 'true';
  }

  // String literal: data-reverso="home.hero.title"
  if (initializer.getKind() === SyntaxKind.StringLiteral) {
    return initializer.getText().slice(1, -1); // Remove quotes
  }

  // JSX expression: data-reverso={variable} or data-reverso={"string"}
  if (initializer.getKind() === SyntaxKind.JsxExpression) {
    const expression = initializer.getFirstChildByKind(SyntaxKind.StringLiteral);
    if (expression) {
      return expression.getText().slice(1, -1);
    }

    // Check for template literal
    const template = initializer.getFirstChildByKind(SyntaxKind.NoSubstitutionTemplateLiteral);
    if (template) {
      return template.getText().slice(1, -1);
    }

    // Check for number literal
    const numLiteral = initializer.getFirstChildByKind(SyntaxKind.NumericLiteral);
    if (numLiteral) {
      return numLiteral.getText();
    }

    // Check for true/false
    const trueLiteral = initializer.getFirstChildByKind(SyntaxKind.TrueKeyword);
    if (trueLiteral) {
      return 'true';
    }

    const falseLiteral = initializer.getFirstChildByKind(SyntaxKind.FalseKeyword);
    if (falseLiteral) {
      return 'false';
    }

    // Anything else (variables, template literals with substitutions, calls)
    // cannot be resolved statically. Treat it as absent rather than turning
    // the source text into a bogus path or option.
    const jsxExpr = initializer as JsxExpression;
    void jsxExpr.getExpression();
  }

  return undefined;
}

/**
 * Parse raw attribute strings into typed FieldAttributes.
 */
function parseFieldAttributes(raw: Record<string, string | undefined>): Partial<FieldAttributes> {
  const attrs: Partial<FieldAttributes> = {};

  if (raw.type) {
    attrs.type = raw.type as FieldAttributes['type'];
  }
  if (raw.label) {
    attrs.label = raw.label;
  }
  if (raw.placeholder) {
    attrs.placeholder = raw.placeholder;
  }
  if (raw.required !== undefined) {
    attrs.required = raw.required === 'true' || raw.required === '';
  }
  if (raw.validation) {
    attrs.validation = raw.validation;
  }
  if (raw.options) {
    attrs.options = raw.options;
  }
  if (raw.condition) {
    attrs.condition = raw.condition;
  }
  if (raw.default) {
    attrs.default = raw.default;
  }
  if (raw.help) {
    attrs.help = raw.help;
  }
  if (raw.min !== undefined) {
    const num = Number(raw.min);
    if (!Number.isNaN(num)) {
      attrs.min = num;
    }
  }
  if (raw.max !== undefined) {
    const num = Number(raw.max);
    if (!Number.isNaN(num)) {
      attrs.max = num;
    }
  }
  if (raw.step !== undefined) {
    const num = Number(raw.step);
    if (!Number.isNaN(num)) {
      attrs.step = num;
    }
  }
  if (raw.accept) {
    attrs.accept = raw.accept;
  }
  if (raw.multiple !== undefined) {
    attrs.multiple = raw.multiple === 'true' || raw.multiple === '';
  }
  if (raw.rows !== undefined) {
    const num = Number(raw.rows);
    if (!Number.isNaN(num)) {
      attrs.rows = num;
    }
  }
  if (raw.width !== undefined) {
    const num = Number(raw.width);
    if (!Number.isNaN(num) && num >= 1 && num <= 12) {
      attrs.width = num;
    }
  }
  if (raw.readonly !== undefined) {
    attrs.readonly = raw.readonly === 'true' || raw.readonly === '';
  }
  if (raw.hidden !== undefined) {
    attrs.hidden = raw.hidden === 'true' || raw.hidden === '';
  }

  return attrs;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00a0',
  copy: '\u00a9',
  reg: '\u00ae',
  trade: '\u2122',
  hellip: '\u2026',
  mdash: '\u2014',
  ndash: '\u2013',
  lsquo: '\u2018',
  rsquo: '\u2019',
  ldquo: '\u201c',
  rdquo: '\u201d',
  laquo: '\u00ab',
  raquo: '\u00bb',
  middot: '\u00b7',
  bull: '\u2022',
  deg: '\u00b0',
  euro: '\u20ac',
};

/** Decode the HTML entities JSX text may contain (`&amp;`, `&#39;`, `&#x27;`). */
export function decodeHtmlEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Normalize raw JSX text the way React renders it: line breaks and the
 * indentation around them collapse to single spaces, then entities are
 * decoded (so `&nbsp;` survives the whitespace collapse).
 */
function normalizeJsxText(raw: string): string {
  return decodeHtmlEntities(raw.replace(/[ \t\r\n]+/g, ' ').trim());
}

/** Text of a string literal or substitution-free template literal node. */
function literalText(node: Node | undefined): string | undefined {
  if (!node) return undefined;
  if (
    node.getKind() === SyntaxKind.StringLiteral ||
    node.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
  ) {
    return node.getText().slice(1, -1);
  }
  return undefined;
}

/**
 * Fallback of a `<anything>.get(path, 'fallback')` call — the pattern the
 * SDK uses to render content (`page.get('home.hero.title', 'Welcome')`).
 */
function getCallFallback(node: Node | undefined): string | undefined {
  if (!node || node.getKind() !== SyntaxKind.CallExpression) return undefined;
  const call = node as CallExpression;
  const callee = call.getExpression();
  if (callee.getKind() !== SyntaxKind.PropertyAccessExpression) return undefined;
  if (callee.getLastChildByKind(SyntaxKind.Identifier)?.getText() !== 'get') return undefined;
  return literalText(call.getArguments()[1]);
}

/** Static value of an expression: a literal, or the fallback of a `.get()` call. */
function staticExpressionValue(node: Node | undefined): string | undefined {
  return literalText(node) ?? getCallFallback(node);
}

/**
 * Static value of a regular (non-marker) attribute such as `src` or `href`:
 * a string literal, `{"literal"}`, or `{page.get(path, 'fallback')}`.
 */
function getStaticAttribute(
  element: JsxOpeningElement | JsxSelfClosingElement,
  name: string
): string | undefined {
  const attr = element.getAttribute(name);
  if (!attr || attr.getKind() !== SyntaxKind.JsxAttribute) return undefined;
  const initializer = (attr as JsxAttribute).getInitializer();
  if (!initializer) return undefined;
  if (initializer.getKind() === SyntaxKind.StringLiteral) {
    return decodeHtmlEntities(initializer.getText().slice(1, -1));
  }
  if (initializer.getKind() === SyntaxKind.JsxExpression) {
    return staticExpressionValue((initializer as JsxExpression).getExpression());
  }
  return undefined;
}

/**
 * Get the text content of a JSX element: its direct text children (entities
 * decoded, whitespace collapsed) and the fallbacks of `{x.get(path, '...')}`
 * expression children, in order.
 */
export function getElementTextContent(
  element: JsxOpeningElement | JsxSelfClosingElement
): string | undefined {
  // Self-closing elements have no children
  if (element.getKind() === SyntaxKind.JsxSelfClosingElement) {
    return undefined;
  }

  const parent = element.getParentIfKind(SyntaxKind.JsxElement);
  if (!parent) {
    return undefined;
  }

  const textParts: string[] = [];
  for (const child of parent.getJsxChildren()) {
    let text: string | undefined;
    if (child.getKind() === SyntaxKind.JsxText) {
      text = normalizeJsxText(child.getText());
    } else if (child.getKind() === SyntaxKind.JsxExpression) {
      text = staticExpressionValue((child as JsxExpression).getExpression());
    }
    if (text) {
      textParts.push(text);
    }
  }

  return textParts.length > 0 ? textParts.join(' ') : undefined;
}

const IMAGE_TAGS = new Set(['img', 'Image']);
const LINK_TAGS = new Set(['a', 'Link']);
const LINK_FIELD_TYPES = new Set(['link', 'url']);

/**
 * Default content the source code renders for a marked element, used to
 * pre-fill the field in the admin:
 * - images (`img`, `Image`): the `src`;
 * - links (`a`, `Link`): the `href` for link/url fields or links without
 *   text, otherwise the link text;
 * - everything else: the text content (see {@link getElementTextContent}).
 *
 * An explicit `data-reverso-default` takes precedence in the generator.
 */
export function getElementDefaultContent(
  element: JsxOpeningElement | JsxSelfClosingElement
): string | undefined {
  const tag = element.getTagNameNode().getText();
  if (IMAGE_TAGS.has(tag)) {
    return getStaticAttribute(element, 'src') || getElementTextContent(element);
  }
  const text = getElementTextContent(element);
  if (LINK_TAGS.has(tag)) {
    const type = getStaticAttribute(element, `${MARKER_PREFIX}type`);
    const href = getStaticAttribute(element, 'href');
    if (href && (!text || (type !== undefined && LINK_FIELD_TYPES.has(type)))) {
      return href;
    }
  }
  return text;
}
