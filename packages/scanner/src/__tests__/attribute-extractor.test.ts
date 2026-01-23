import { type JsxOpeningElement, Project, SyntaxKind } from 'ts-morph';
import { describe, expect, it } from 'vitest';
import {
  extractAttributes,
  getElementTextContent,
  hasReversoMarker,
} from '../parser/attribute-extractor.js';

function createTestElement(jsx: string): JsxOpeningElement | null {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.tsx', `const Component = () => (${jsx});`);
  const elements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement);
  return elements[0] ?? null;
}

function createSelfClosingElement(jsx: string) {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile('test.tsx', `const Component = () => (${jsx});`);
  const elements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement);
  return elements[0] ?? null;
}

describe('hasReversoMarker', () => {
  it('returns true for element with data-reverso attribute', () => {
    const element = createTestElement('<h1 data-reverso="home.hero.title">Title</h1>');
    expect(element).not.toBeNull();
    expect(hasReversoMarker(element!)).toBe(true);
  });

  it('returns false for element without data-reverso attribute', () => {
    const element = createTestElement('<h1 className="title">Title</h1>');
    expect(element).not.toBeNull();
    expect(hasReversoMarker(element!)).toBe(false);
  });

  it('returns false for element with only data-reverso-type', () => {
    const element = createTestElement('<h1 data-reverso-type="text">Title</h1>');
    expect(element).not.toBeNull();
    expect(hasReversoMarker(element!)).toBe(false);
  });
});

describe('extractAttributes', () => {
  it('extracts path from data-reverso attribute', () => {
    const element = createTestElement('<h1 data-reverso="home.hero.title">Title</h1>');
    const result = extractAttributes(element!);
    expect(result).not.toBeNull();
    expect(result?.path).toBe('home.hero.title');
  });

  it('extracts type attribute', () => {
    const element = createTestElement(
      '<h1 data-reverso="home.hero.title" data-reverso-type="text">Title</h1>'
    );
    const result = extractAttributes(element!);
    expect(result?.attributes.type).toBe('text');
  });

  it('extracts label and placeholder', () => {
    const element = createTestElement(
      '<input data-reverso="home.hero.email" data-reverso-label="Email" data-reverso-placeholder="Enter email" />'
    );
    const result = extractAttributes(
      createSelfClosingElement(
        '<input data-reverso="home.hero.email" data-reverso-label="Email" data-reverso-placeholder="Enter email" />'
      )!
    );
    expect(result?.attributes.label).toBe('Email');
    expect(result?.attributes.placeholder).toBe('Enter email');
  });

  describe('boolean attributes', () => {
    it('handles required as boolean attribute (no value)', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.email" data-reverso-required />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.required).toBe(true);
    });

    it('handles required="true"', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.email" data-reverso-required="true" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.required).toBe(true);
    });

    it('handles required="false"', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.email" data-reverso-required="false" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.required).toBe(false);
    });

    it('handles required={true}', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.email" data-reverso-required={true} />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.required).toBe(true);
    });

    it('handles required={false}', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.email" data-reverso-required={false} />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.required).toBe(false);
    });

    it('handles multiple boolean attribute', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.files" data-reverso-multiple />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.multiple).toBe(true);
    });

    it('handles readonly="false"', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.name" data-reverso-readonly="false" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.readonly).toBe(false);
    });

    it('handles hidden={false}', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.name" data-reverso-hidden={false} />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.hidden).toBe(false);
    });
  });

  describe('numeric attributes', () => {
    it('extracts min and max', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.count" data-reverso-min="0" data-reverso-max="100" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.min).toBe(0);
      expect(result?.attributes.max).toBe(100);
    });

    it('extracts step', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.price" data-reverso-step="0.01" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.step).toBe(0.01);
    });

    it('extracts rows', () => {
      const element = createSelfClosingElement(
        '<textarea data-reverso="home.hero.description" data-reverso-rows="5" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.rows).toBe(5);
    });

    it('extracts width within valid range', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.name" data-reverso-width="6" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.width).toBe(6);
    });

    it('ignores invalid width', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.name" data-reverso-width="15" />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.width).toBeUndefined();
    });

    it('handles numeric values in JSX expressions', () => {
      const element = createSelfClosingElement(
        '<input data-reverso="home.hero.count" data-reverso-min={10} data-reverso-max={50} />'
      );
      const result = extractAttributes(element!);
      expect(result?.attributes.min).toBe(10);
      expect(result?.attributes.max).toBe(50);
    });
  });

  it('returns null for element without data-reverso', () => {
    const element = createTestElement('<h1 className="title">Title</h1>');
    const result = extractAttributes(element!);
    expect(result).toBeNull();
  });
});

describe('getElementTextContent', () => {
  it('returns undefined for self-closing element', () => {
    const element = createSelfClosingElement('<input data-reverso="home.hero.email" />');
    const text = getElementTextContent(element!);
    expect(text).toBeUndefined();
  });

  // Note: Text content extraction is validated in integration tests
  // The unit test setup with in-memory fs has AST structure differences
});
