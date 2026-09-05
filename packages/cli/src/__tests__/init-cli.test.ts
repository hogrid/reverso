/**
 * `reverso init --yes --skip-install` against a real temporary project, through
 * the built binary: what a user gets on an existing codebase.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const BIN = resolve(dirname(fileURLToPath(import.meta.url)), '../../bin/reverso.js');

/** Run the binary and return everything it printed (spinners write to stderr). */
function runInit(cwd: string, args: string[]): string {
  const result = spawnSync('node', [BIN, 'init', ...args], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' },
    timeout: 60_000,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0) throw new Error(`reverso init exited with ${result.status}:\n${output}`);
  return output;
}

describe('reverso init --yes --skip-install', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'reverso-init-cli-'));
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ name: 'existing-site', private: true }));
    mkdirSync(join(cwd, 'app'));
  });

  afterEach(() => rmSync(cwd, { recursive: true, force: true }));

  it.skipIf(!existsSync(BIN))('writes config, .gitignore and valid admin credentials without touching npm', () => {
    const output = runInit(cwd, ['--yes', '--skip-install']);

    expect(output).toContain('Created reverso.config.ts');
    expect(output).not.toContain('Installing dependencies');

    const config = readFileSync(join(cwd, 'reverso.config.ts'), 'utf-8');
    expect(config).toContain("srcDir: './app'");
    expect(config).toContain("url: '.reverso/reverso.db'");

    // No .gitignore existed: one is created so the database and credentials never get committed.
    const gitignore = readFileSync(join(cwd, '.gitignore'), 'utf-8');
    expect(gitignore).toContain('.reverso/');

    const admin = JSON.parse(readFileSync(join(cwd, '.reverso/admin.json'), 'utf-8')) as {
      email: string;
      password: string;
    };
    // The API only accepts real-looking emails; the hostname-based default did not pass.
    expect(admin.email).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i);
    expect(admin.password.length).toBeGreaterThanOrEqual(12);
  });

  it.skipIf(!existsSync(BIN))('appends to an existing .gitignore only once', () => {
    writeFileSync(join(cwd, '.gitignore'), 'node_modules/\n');
    runInit(cwd, ['--yes', '--skip-install']);
    runInit(cwd, ['--yes', '--skip-install', '--force']);
    const gitignore = readFileSync(join(cwd, '.gitignore'), 'utf-8');
    expect(gitignore.match(/\.reverso\//g)).toHaveLength(1);
  });
});
