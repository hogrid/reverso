/**
 * Extracts data-reverso-* attributes from JSX elements.
 */

import { type FieldAttributes, MARKER_ATTRIBUTE, MARKER_PREFIX } from '@reverso/core';
import type {
  JsxAttribute,
  JsxExpression,
  JsxOpeningElement,
  JsxSelfClosingElement,
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

    // For other expressions, return the raw text
    // Cast to JsxExpression since we've checked the kind above
    const jsxExpr = initializer as JsxExpression;
    const expressionNode = jsxExpr.getExpression();
    if (expressionNode) {
      return expressionNode.getText();
    }
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

/**
 * Get the text content of a JSX element.
 */
export function getElementTextContent(
  element: JsxOpeningElement | JsxSelfClosingElement
): string | undefined {
  // Self-closing elements have no children
  if (element.getKind() === SyntaxKind.JsxSelfClosingElement) {
    return undefined;
  }

  const openingElement = element as JsxOpeningElement;
  const parent = openingElement.getParent();

  if (!parent || parent.getKind() !== SyntaxKind.JsxElement) {
    return undefined;
  }

  // Get all children and extract text
  const children = parent.getChildren();
  const textParts: string[] = [];

  for (const child of children) {
    if (child.getKind() === SyntaxKind.JsxText) {
      const text = child.getText().trim();
      if (text) {
        textParts.push(text);
      }
    }
  }

  return textParts.length > 0 ? textParts.join(' ') : undefined;
}
