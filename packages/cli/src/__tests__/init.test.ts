import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectSrcDir } from '../commands/init.js';

describe('detectSrcDir', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'reverso-init-'));
  });
  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it('prefers src/, then app/, pages/, components/, then the project root', () => {
    expect(detectSrcDir(cwd)).toBe('./');
    mkdirSync(join(cwd, 'components'));
    expect(detectSrcDir(cwd)).toBe('./components');
    mkdirSync(join(cwd, 'app'));
    expect(detectSrcDir(cwd)).toBe('./app');
    mkdirSync(join(cwd, 'src'));
    expect(detectSrcDir(cwd)).toBe('./src');
  });
});
