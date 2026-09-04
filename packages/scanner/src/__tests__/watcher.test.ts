/**
 * Watch mode: adding, editing and removing a marker file must produce a
 * fresh scan with the right field count (chokidar v4 dropped glob support,
 * which silently broke this once).
 */

import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createScanner, type ScanEvent, type Scanner } from '../scanner.js';

function component(paths: string[]): string {
  return `export function C() {\n  return (<div>${paths
    .map((p) => `<span data-reverso="${p}" data-reverso-type="text">x</span>`)
    .join('')}</div>);\n}\n`;
}

describe('scanner watch mode', () => {
  let dir: string;
  let scanner: Scanner;
  let events: ScanEvent[];

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), 'reverso-watch-'));
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src/First.tsx'), component(['home.hero.title']));
    events = [];
    scanner = createScanner({
      srcDir: join(dir, 'src'),
      outputDir: join(dir, '.reverso'),
      watchDebounce: 50,
    });
    scanner.on((event) => {
      events.push(event);
    });
    await scanner.scan();
    await scanner.startWatch();
  });

  afterEach(() => {
    scanner.stopWatch();
    rmSync(dir, { recursive: true, force: true });
  });

  /** Wait until a completed scan reports `totalFields`. */
  async function waitForFieldCount(totalFields: number, timeoutMs = 10_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const done = events.filter((e) => e.type === 'complete');
      const last = done[done.length - 1];
      if (last?.schema?.totalFields === totalFields) return;
      await new Promise((r) => setTimeout(r, 100));
    }
    const seen = events.filter((e) => e.type === 'complete').map((e) => e.schema?.totalFields);
    throw new Error(`No scan reported ${totalFields} fields; saw ${JSON.stringify(seen)}`);
  }

  it('starts from the initial scan', () => {
    expect(scanner.getSchema()?.totalFields).toBe(1);
  });

  it('rescans when a marker file is added, changed and removed', { timeout: 20_000 }, async () => {
    writeFileSync(join(dir, 'src/Second.tsx'), component(['home.hero.subtitle', 'home.hero.cta']));
    await waitForFieldCount(3);
    expect(scanner.getSchema()?.totalFields).toBe(3);

    writeFileSync(join(dir, 'src/Second.tsx'), component(['home.hero.subtitle']));
    await waitForFieldCount(2);

    unlinkSync(join(dir, 'src/Second.tsx'));
    await waitForFieldCount(1);
  });

  it('ignores files outside the include patterns', { timeout: 20_000 }, async () => {
    writeFileSync(join(dir, 'src/notes.md'), 'data-reverso="home.hero.nope"');
    writeFileSync(join(dir, 'src/Third.tsx'), component(['home.hero.extra']));
    await waitForFieldCount(2);
    const paths = scanner
      .getSchema()
      ?.pages.flatMap((p) => p.sections.flatMap((s) => s.fields.map((f) => f.path)));
    expect(paths).not.toContain('home.hero.nope');
  });
});
