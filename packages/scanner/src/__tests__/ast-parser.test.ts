/**
 * AstParser end to end against a real directory: files on disk in, fields out.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AstParser } from '../parser/ast-parser.js';

describe('AstParser.parseAll', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'reverso-parser-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('reports a clear error when the source directory does not exist', async () => {
    const parser = new AstParser({ srcDir: join(dir, 'missing') });
    const result = await parser.parseAll();

    expect(result.fields).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.type).toBe('io');
    expect(result.errors[0]?.message).toContain('Source directory not found');
    expect(result.errors[0]?.message).toContain('srcDir');
  });

  it('detects markers in .tsx and .jsx files and skips excluded folders', async () => {
    mkdirSync(join(dir, 'components'), { recursive: true });
    mkdirSync(join(dir, 'node_modules', 'pkg'), { recursive: true });
    writeFileSync(
      join(dir, 'components', 'Hero.tsx'),
      `export function Hero() {
  return (
    <section>
      <h1 data-reverso="home.hero.title" data-reverso-type="text">Hello</h1>
      <p data-reverso="home.hero.body" data-reverso-type="textarea" data-reverso-required>Body</p>
      <img data-reverso="home.hero.image" data-reverso-type="image" src="/x.png" alt="" />
      <span data-reverso={\`home.\${slug}.dynamic\`}>skipped</span>
    </section>
  );
}
`
    );
    writeFileSync(
      join(dir, 'components', 'Footer.jsx'),
      `export const Footer = () => <footer data-reverso="home.footer.text">Footer</footer>;\n`
    );
    writeFileSync(
      join(dir, 'node_modules', 'pkg', 'Ignored.tsx'),
      `export const X = () => <b data-reverso="ignored.a.b">x</b>;\n`
    );

    const parser = new AstParser({ srcDir: dir });
    const result = await parser.parseAll();

    expect(result.errors).toEqual([]);
    const paths = result.fields.map((f) => f.path).sort();
    expect(paths).toEqual(['home.footer.text', 'home.hero.body', 'home.hero.image', 'home.hero.title']);

    const body = result.fields.find((f) => f.path === 'home.hero.body');
    expect(body?.attributes.type).toBe('textarea');
    expect(body?.attributes.required).toBe('true');
    expect(body?.file.endsWith('Hero.tsx')).toBe(true);
    expect(body?.line).toBeGreaterThan(0);
  });

  it('returns an empty result for a directory with no components', async () => {
    const parser = new AstParser({ srcDir: dir });
    const result = await parser.parseAll();
    expect(result.errors).toEqual([]);
    expect(result.fields).toEqual([]);
  });
});
