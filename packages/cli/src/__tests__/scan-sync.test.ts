/**
 * `reverso scan` sync target resolution and the sync request itself.
 */

import { createServer, type Server } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ProjectSchema } from '@reverso/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { resolveSyncTarget, syncSchemaToServer } from '../commands/scan.js';

const SCHEMA: ProjectSchema = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  pages: [],
  pageCount: 0,
  totalFields: 0,
  meta: { srcDir: 'src', filesScanned: 0, filesWithMarkers: 0, scanDuration: 0 },
};

describe('resolveSyncTarget', () => {
  let cwd: string;
  const savedEnv = { url: process.env.REVERSO_API_URL, key: process.env.REVERSO_API_KEY };

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'reverso-scan-'));
    process.env.REVERSO_API_URL = undefined;
    process.env.REVERSO_API_KEY = undefined;
    delete process.env.REVERSO_API_URL;
    delete process.env.REVERSO_API_KEY;
  });

  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
    if (savedEnv.url !== undefined) process.env.REVERSO_API_URL = savedEnv.url;
    if (savedEnv.key !== undefined) process.env.REVERSO_API_KEY = savedEnv.key;
  });

  it('defaults to localhost on the configured dev port with no key', () => {
    expect(resolveSyncTarget(cwd, {}, 3007)).toEqual({ apiUrl: 'http://localhost:3007', apiKey: undefined });
  });

  it('picks up the URL and key left by a running reverso dev', () => {
    mkdirSync(join(cwd, '.reverso'));
    writeFileSync(
      join(cwd, '.reverso/dev-server.json'),
      JSON.stringify({ apiUrl: 'http://localhost:3101', apiKey: 'dev-key-0123456789abcdef', pid: 1 })
    );
    expect(resolveSyncTarget(cwd, {}, 3001)).toEqual({
      apiUrl: 'http://localhost:3101',
      apiKey: 'dev-key-0123456789abcdef',
    });
  });

  it('ignores a corrupt dev-server.json', () => {
    mkdirSync(join(cwd, '.reverso'));
    writeFileSync(join(cwd, '.reverso/dev-server.json'), '{not json');
    expect(resolveSyncTarget(cwd, {}, 3001).apiUrl).toBe('http://localhost:3001');
  });

  it('lets environment variables override the dev server file', () => {
    mkdirSync(join(cwd, '.reverso'));
    writeFileSync(
      join(cwd, '.reverso/dev-server.json'),
      JSON.stringify({ apiUrl: 'http://localhost:3101', apiKey: 'dev-key-0123456789abcdef' })
    );
    process.env.REVERSO_API_URL = 'https://cms.example.com/';
    process.env.REVERSO_API_KEY = 'env-key-0123456789abcdef';
    expect(resolveSyncTarget(cwd, {}, 3001)).toEqual({
      apiUrl: 'https://cms.example.com',
      apiKey: 'env-key-0123456789abcdef',
    });
  });

  it('lets flags override everything', () => {
    process.env.REVERSO_API_URL = 'https://cms.example.com';
    expect(
      resolveSyncTarget(cwd, { apiUrl: 'http://10.0.0.5:4000/', apiKey: 'flag-key-0123456789abcdef' }, 3001)
    ).toEqual({ apiUrl: 'http://10.0.0.5:4000', apiKey: 'flag-key-0123456789abcdef' });
  });
});

describe('syncSchemaToServer', () => {
  let server: Server;
  let url: string;
  let lastRequest: { headers: Record<string, string | string[] | undefined>; body: string } | null;
  let respondWith: { status: number; body: unknown } = { status: 200, body: { success: true } };

  beforeEach(async () => {
    lastRequest = null;
    respondWith = { status: 200, body: { success: true } };
    server = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        lastRequest = { headers: req.headers, body };
        res.writeHead(respondWith.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(respondWith.body));
      });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    url = typeof address === 'object' && address ? `http://127.0.0.1:${address.port}` : '';
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('posts the schema with the API key header', async () => {
    const outcome = await syncSchemaToServer(SCHEMA, { apiUrl: url, apiKey: 'key-0123456789abcdef' });
    expect(outcome).toEqual({ ok: true });
    expect(lastRequest?.headers['x-api-key']).toBe('key-0123456789abcdef');
    expect(JSON.parse(lastRequest?.body ?? '{}')).toMatchObject({ deleteRemoved: true, schema: { version: '1.0.0' } });
  });

  it('omits the header without a key', async () => {
    await syncSchemaToServer(SCHEMA, { apiUrl: url });
    expect(lastRequest?.headers['x-api-key']).toBeUndefined();
  });

  it('reports unauthorized on 401/403', async () => {
    respondWith = { status: 401, body: { success: false } };
    expect(await syncSchemaToServer(SCHEMA, { apiUrl: url })).toEqual({ ok: false, reason: 'unauthorized' });
    respondWith = { status: 403, body: { success: false } };
    expect(await syncSchemaToServer(SCHEMA, { apiUrl: url })).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('reports server errors with the message', async () => {
    respondWith = { status: 500, body: { success: false, message: 'Failed to sync schema' } };
    expect(await syncSchemaToServer(SCHEMA, { apiUrl: url })).toEqual({
      ok: false,
      reason: 'error',
      detail: 'Failed to sync schema',
    });
  });

  it('reports an unreachable server', async () => {
    const outcome = await syncSchemaToServer(SCHEMA, { apiUrl: 'http://127.0.0.1:1' });
    expect(outcome.ok).toBe(false);
    expect(outcome.ok === false && outcome.reason).toBe('unreachable');
  });
});
