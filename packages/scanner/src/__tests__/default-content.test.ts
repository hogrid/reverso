/**
 * Default content extraction, source ordering and scanner warnings.
 *
 * The admin pre-fills fields with the defaults the scanner finds, so the
 * patterns integrators actually write (`{page.get(path, 'Fallback')}`, image
 * `src`, link `href`) must produce a defaultContent.
 */

import type { DetectedField } from '@reverso/core';
import { Project, SyntaxKind } from 'ts-morph';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getElementTextContent } from '../parser/attribute-extractor.js';
import { walkJsxElements } from '../parser/jsx-walker.js';
import { generateSchema } from '../schema/generator.js';

function walk(jsx: string): DetectedField[] {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(
    '/src/Test.tsx',
    `export const Component = ({ page }) => (\n${jsx}\n);`
  );
  return walkJsxElements(sourceFile);
}

function defaultOf(jsx: string): string | undefined {
  return walk(jsx)[0]?.textContent;
}

describe('default content extraction', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('reads plain JSX text', () => {
    expect(defaultOf('<h1 data-reverso="home.hero.title">Welcome</h1>')).toBe('Welcome');
  });

  it('reads plain JSX text through getElementTextContent too', () => {
    const project = new Project({ useInMemoryFileSystem: true });
    const sourceFile = project.createSourceFile(
      '/src/T.tsx',
      'const C = () => (<h1 data-reverso="home.hero.title">Welcome</h1>);'
    );
    const el = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement)[0];
    expect(el && getElementTextContent(el)).toBe('Welcome');
  });

  it('reads the fallback of a .get(path, fallback) call child', () => {
    expect(
      defaultOf(`<h1 data-reverso="home.hero.title">{page.get('home.hero.title', 'Build faster')}</h1>`)
    ).toBe('Build faster');
    expect(
      defaultOf('<p data-reverso="home.hero.sub">{content.get("home.hero.sub", "Double quoted")}</p>')
    ).toBe('Double quoted');
    expect(
      defaultOf('<p data-reverso="home.hero.sub">{home.get(`home.hero.sub`, `Template`)}</p>')
    ).toBe('Template');
  });

  it('ignores .get calls without a string fallback', () => {
    expect(defaultOf('<p data-reverso="home.hero.sub">{page.get("home.hero.sub", fallback)}</p>')).toBe(
      undefined
    );
  });

  it('decodes HTML entities and collapses whitespace in multi-line text', () => {
    const text = defaultOf(`<p data-reverso="home.hero.sub">
      Tom &amp; Jerry&nbsp;rock
      hard &#39;n&#x27; fast &copy; &quot;2026&quot;
    </p>`);
    expect(text).toBe('Tom & Jerry rock hard \'n\' fast © "2026"');
  });

  it('reads img src literals (and src from a .get call)', () => {
    expect(
      defaultOf('<img data-reverso="home.hero.image" data-reverso-type="image" src="/hero.jpg" alt="Hero" />')
    ).toBe('/hero.jpg');
    expect(
      defaultOf(
        `<img data-reverso="home.hero.image" data-reverso-type="image" src={page.get('home.hero.image', '/hero.jpg')} alt="" />`
      )
    ).toBe('/hero.jpg');
    expect(defaultOf('<Image data-reverso="home.hero.image" src="/next.png" alt="x" />')).toBe(
      '/next.png'
    );
  });

  it('reads link href for link/url fields and for links without text', () => {
    expect(
      defaultOf('<a data-reverso="home.cta.link" data-reverso-type="link" href="/signup">Sign up</a>')
    ).toBe('/signup');
    expect(defaultOf('<a data-reverso="home.cta.url" data-reverso-type="url" href="https://x.test">x</a>')).toBe(
      'https://x.test'
    );
    expect(defaultOf('<a data-reverso="home.cta.icon" href="/home" />')).toBe('/home');
    expect(defaultOf('<a data-reverso="home.cta.label" href="/signup">Get started</a>')).toBe(
      'Get started'
    );
  });
});

describe('data-reverso-default', () => {
  it('wins over the extracted text', () => {
    const fields = walk(
      '<h1 data-reverso="home.hero.title" data-reverso-default="Explicit">{page.get("home.hero.title", "Implicit")}</h1>'
    );
    const schema = generateSchema(fields);
    expect(schema.pages[0]?.sections[0]?.fields[0]?.defaultContent).toBe('Explicit');
  });

  it('is used when there is no text at all', () => {
    const fields = walk('<input data-reverso="home.form.email" data-reverso-default="you@example.com" />');
    const schema = generateSchema(fields);
    expect(schema.pages[0]?.sections[0]?.fields[0]?.defaultContent).toBe('you@example.com');
  });
});

describe('source order', () => {
  it('walks markers in document order, mixing paired and self-closing elements', () => {
    const fields = walk(`<section>
      <img data-reverso="home.hero.image" src="/a.png" />
      <h1 data-reverso="home.hero.title">Title</h1>
      <input data-reverso="home.hero.email" />
      <p data-reverso="home.hero.body">Body</p>
    </section>`);
    expect(fields.map((f) => f.path)).toEqual([
      'home.hero.image',
      'home.hero.title',
      'home.hero.email',
      'home.hero.body',
    ]);
  });

  it('keeps fields in source order (file, line, column) even with sort: true', () => {
    const at = (path: string, file: string, line: number, column = 1): DetectedField => ({
      path,
      attributes: {},
      file,
      line,
      column,
      element: 'p',
    });
    const schema = generateSchema(
      [
        at('home.hero.zeta', '/src/B.tsx', 1),
        at('home.hero.title', '/src/A.tsx', 10),
        at('home.hero.alpha', '/src/A.tsx', 20),
        at('home.hero.cta', '/src/A.tsx', 10, 30),
        at('about.team.name', '/src/About.tsx', 1),
      ],
      { sort: true }
    );
    expect(schema.pages.map((p) => p.slug)).toEqual(['about', 'home']);
    expect(schema.pages[1]?.sections[0]?.fields.map((f) => f.path)).toEqual([
      'home.hero.title',
      'home.hero.cta',
      'home.hero.alpha',
      'home.hero.zeta',
    ]);
  });
});

describe('scanner warnings', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  const output = () => warn.mock.calls.map((c: unknown[]) => c.join(' ')).join('\n');

  it('warns about dynamic markers with file:line', () => {
    const fields = walk(`<div>
      <h1 data-reverso={\`home.\${slug}.title\`}>A</h1>
      <h2 data-reverso={path}>B</h2>
      <h3 data-reverso="home.hero.ok">C</h3>
    </div>`);
    expect(fields.map((f) => f.path)).toEqual(['home.hero.ok']);
    expect(warn).toHaveBeenCalled();
    expect(output()).toContain('/src/Test.tsx:3');
    expect(output()).toContain('/src/Test.tsx:4');
  });

  it('warns about unknown data-reverso-type values and falls back to text', () => {
    const fields = walk('<div data-reverso="home.hero.body" data-reverso-type="richtext">x</div>');
    const schema = generateSchema(fields);
    expect(schema.pages[0]?.sections[0]?.fields[0]?.type).toBe('text');
    expect(output()).toContain('richtext');
    expect(output()).toContain('/src/Test.tsx:2');
  });

  it('does not warn for valid markers', () => {
    generateSchema(walk('<div data-reverso="home.hero.body" data-reverso-type="wysiwyg">x</div>'));
    expect(warn).not.toHaveBeenCalled();
  });
});
