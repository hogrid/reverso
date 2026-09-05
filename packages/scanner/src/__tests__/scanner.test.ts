/**
 * Scanner tests.
 *
 * The scanner's result is what the CLI writes to disk and pushes to the
 * server with `deleteRemoved`, so "found nothing" and "could not read the
 * sources" must never look the same.
 */

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createScanner, type ScanEvent } from '../scanner.js';

const MARKER = '<h1 data-reverso="home.hero.title">Welcome</h1>';

describe('Scanner', () => {
  let cwd = '';

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true });
    cwd = '';
  });

  function project(): { srcDir: string; outputDir: string } {
    cwd = mkdtempSync(join(tmpdir(), 'reverso-scanner-'));
    const srcDir = join(cwd, 'src');
    mkdirSync(srcDir);
    writeFileSync(join(srcDir, 'Hero.tsx'), `export const Hero = () => (${MARKER});`);
    return { srcDir, outputDir: join(cwd, '.reverso') };
  }

  it('reports the fields it found', async () => {
    const { srcDir, outputDir } = project();
    const events: ScanEvent[] = [];
    const scanner = createScanner({ srcDir, outputDir });
    scanner.on((event) => events.push(event));

    const result = await scanner.scan();

    expect(result.success).toBe(true);
    expect(result.schema.totalFields).toBe(1);
    expect(events.map((e) => e.type)).toContain('complete');
    expect(existsSync(join(outputDir, 'schema.json'))).toBe(true);
  });

  it('fails instead of reporting an empty schema when the source directory is missing', async () => {
    const { outputDir } = project();
    const events: ScanEvent[] = [];
    const scanner = createScanner({ srcDir: join(cwd, 'does-not-exist'), outputDir });
    scanner.on((event) => events.push(event));

    const result = await scanner.scan();

    expect(result.success).toBe(false);
    expect(result.errors.some((e) => e.type === 'io')).toBe(true);
    // No "complete": that event is what the CLI syncs with deleteRemoved,
    // which would delete every field on the server and its content.
    expect(events.map((e) => e.type)).not.toContain('complete');
    expect(events.map((e) => e.type)).toContain('error');
    // And nothing is written over the schema on disk either.
    expect(existsSync(join(outputDir, 'schema.json'))).toBe(false);
  });
});
