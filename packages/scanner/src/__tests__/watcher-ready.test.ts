/**
 * FileWatcher readiness: once `waitUntilReady()` resolves, a file created or
 * changed right away must be reported, and the watcher must work for a
 * project that lives under a directory named like an excluded one (`build`,
 * `dist`, ...).
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createWatcher, type FileWatcher, type WatchEvent } from '../watch/watcher.js';

const roots: string[] = [];
const watchers: FileWatcher[] = [];

afterEach(async () => {
  await Promise.all(watchers.splice(0).map((w) => w.stop()));
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function tempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'reverso-watcher-'));
  roots.push(root);
  return root;
}

async function watch(srcDir: string, events: WatchEvent[]): Promise<FileWatcher> {
  const watcher = createWatcher({ srcDir, debounce: 20, onEvent: (e) => void events.push(e) });
  watchers.push(watcher);
  watcher.start();
  await watcher.waitUntilReady();
  return watcher;
}

async function waitFor(check: () => boolean, timeoutMs = 8000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return true;
    await new Promise((r) => setTimeout(r, 25));
  }
  return check();
}

describe('FileWatcher', () => {
  it('watches a project nested under a directory named like an excluded one', { timeout: 15_000 }, async () => {
    const root = tempRoot();
    const srcDir = join(root, 'build', 'dist', 'site', 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(join(srcDir, 'First.tsx'), 'export const A = 1;\n');

    const events: WatchEvent[] = [];
    await watch(srcDir, events);
    writeFileSync(join(srcDir, 'Second.tsx'), 'export const B = 1;\n');

    expect(await waitFor(() => events.some((e) => e.path.endsWith('Second.tsx')))).toBe(true);
  });

  it('still ignores excluded directories inside the watched root', async () => {
    const root = tempRoot();
    const srcDir = join(root, 'src');
    mkdirSync(join(srcDir, 'node_modules', 'pkg'), { recursive: true });
    mkdirSync(join(srcDir, 'components'), { recursive: true });

    const events: WatchEvent[] = [];
    await watch(srcDir, events);
    writeFileSync(join(srcDir, 'node_modules', 'pkg', 'index.tsx'), 'export const X = 1;\n');
    writeFileSync(join(srcDir, 'components', 'Card.tsx'), 'export const Card = 1;\n');

    expect(await waitFor(() => events.some((e) => e.path.endsWith('Card.tsx')))).toBe(true);
    expect(events.some((e) => e.path.includes('node_modules'))).toBe(false);
  });

  it(
    'reports files created immediately after it becomes ready',
    { timeout: 60_000 },
    async () => {
      // A fresh watcher each round: the race is between "ready" and the OS
      // watch actually being live, so repeat it to make a miss likely.
      const missed: number[] = [];
      for (let round = 0; round < 12; round++) {
        const srcDir = join(tempRoot(), 'src');
        mkdirSync(srcDir);
        writeFileSync(join(srcDir, 'First.tsx'), 'export const A = 1;\n');
        const events: WatchEvent[] = [];
        await watch(srcDir, events);
        writeFileSync(join(srcDir, 'Second.tsx'), 'export const B = 1;\n');
        const seen = await waitFor(
          () => events.some((e) => e.type === 'add' && e.path.endsWith('Second.tsx')),
          4000
        );
        if (!seen) missed.push(round);
      }
      expect(missed).toEqual([]);
    }
  );
});
