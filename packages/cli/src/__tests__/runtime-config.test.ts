/**
 * The single source of truth for where the CLI reads, writes and listens.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_DB_PATH, resolveRuntimeConfig } from '../runtime-config.js';

describe('resolveRuntimeConfig', () => {
  let cwd: string;
  const savedEnv: Record<string, string | undefined> = {};
  const ENV = ['REVERSO_DB_PATH', 'REVERSO_PORT', 'REVERSO_HOST', 'REVERSO_SRC_DIR'];

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'reverso-rc-'));
    for (const k of ENV) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
    for (const k of ENV) {
      if (savedEnv[k] === undefined) delete process.env[k];
      else process.env[k] = savedEnv[k];
    }
  });

  it('uses one default database for every command when there is no config', async () => {
    mkdirSync(join(cwd, 'src'));
    const rc = await resolveRuntimeConfig(cwd);
    expect(rc.hasConfigFile).toBe(false);
    expect(rc.databasePath).toBe(resolve(cwd, DEFAULT_DB_PATH));
    expect(rc.databaseSource).toBe('default');
    expect(rc.port).toBe(3001);
    expect(rc.srcDir).toBe('src');
    expect(rc.warnings).toEqual([]);
  });

  it('warns when the source directory does not exist', async () => {
    const rc = await resolveRuntimeConfig(cwd);
    expect(rc.warnings.some((w) => w.includes('Source directory'))).toBe(true);
  });

  it('reads reverso.config.ts (database, port, srcDir, include/exclude, outputDir)', async () => {
    mkdirSync(join(cwd, 'app'));
    writeFileSync(
      join(cwd, 'reverso.config.ts'),
      `export default {
        srcDir: './app',
        outputDir: '.cms',
        database: { provider: 'sqlite', url: 'data/site.db' },
        scanner: { include: ['**/*.tsx'], exclude: ['**/node_modules/**'] },
        dev: { port: 4100 },
      };`
    );
    const rc = await resolveRuntimeConfig(cwd);
    expect(rc.hasConfigFile).toBe(true);
    expect(rc.srcDir).toBe('./app');
    expect(rc.outputDir).toBe('.cms');
    expect(rc.databasePath).toBe(resolve(cwd, 'data/site.db'));
    expect(rc.databaseSource).toBe('config');
    expect(rc.port).toBe(4100);
    expect(rc.include).toEqual(['**/*.tsx']);
    expect(rc.exclude).toEqual(['**/node_modules/**']);
  });

  it('lets environment override the config and flags override everything', async () => {
    mkdirSync(join(cwd, 'src'));
    writeFileSync(
      join(cwd, 'reverso.config.ts'),
      `export default { database: { provider: 'sqlite', url: 'from-config.db' }, dev: { port: 4100 } };`
    );
    process.env.REVERSO_DB_PATH = '/var/lib/reverso/prod.db';
    process.env.REVERSO_PORT = '5000';
    process.env.REVERSO_HOST = '0.0.0.0';

    const fromEnv = await resolveRuntimeConfig(cwd);
    expect(fromEnv.databasePath).toBe('/var/lib/reverso/prod.db');
    expect(fromEnv.databaseSource).toBe('env');
    expect(fromEnv.port).toBe(5000);
    expect(fromEnv.host).toBe('0.0.0.0');

    const fromFlags = await resolveRuntimeConfig(cwd, { database: 'flag.db', port: '6000', host: '127.0.0.1' });
    expect(fromFlags.databasePath).toBe(resolve(cwd, 'flag.db'));
    expect(fromFlags.databaseSource).toBe('flag');
    expect(fromFlags.port).toBe(6000);
    expect(fromFlags.host).toBe('127.0.0.1');
  });

  it('falls back to SQLite with a warning for unimplemented providers', async () => {
    mkdirSync(join(cwd, 'src'));
    writeFileSync(
      join(cwd, 'reverso.config.ts'),
      `export default { database: { provider: 'postgresql', url: 'postgresql://x' } };`
    );
    const rc = await resolveRuntimeConfig(cwd);
    expect(rc.databasePath).toBe(resolve(cwd, DEFAULT_DB_PATH));
    expect(rc.warnings.some((w) => w.includes('postgresql'))).toBe(true);
  });
});
