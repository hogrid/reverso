/**
 * Production hardening: role checks on every mutating route, login and
 * bootstrap edge cases, SVG uploads, CSP, error leaks, SSRF and proxy trust.
 */

import crypto from 'node:crypto';
import { createAccount, createDatabase, createUser } from '@reverso/db';
import bcrypt from 'bcrypt';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createServer } from '../server.js';
import { createServer as createHttpServer } from 'node:http';
import { assertPublicHost, isPrivateAddress, isUrlSafeForSSRF, postToPublicUrl } from '../utils/security.js';
import { createTestServer, json, multipartFile, sessionCookie, type TestServer } from './helpers.js';

const API_KEY = 'test-api-key-0123456789abcdef';

async function addUser(t: TestServer, email: string, role: 'admin' | 'editor' | 'viewer') {
  const db = createDatabase({ url: t.dbPath });
  const now = new Date();
  const id = crypto.randomUUID();
  await createUser(db, { id, email, name: role, role, createdAt: now, updatedAt: now });
  await createAccount(db, {
    id: crypto.randomUUID(),
    userId: id,
    accountId: id,
    providerId: 'credential',
    password: await bcrypt.hash('password123', 4),
    createdAt: now,
    updatedAt: now,
  });
  db.$client.close();
}

async function login(t: TestServer, email: string): Promise<string> {
  const res = await t.server.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email, password: 'password123' },
  });
  expect(res.statusCode, `login ${email}`).toBe(200);
  return sessionCookie(res);
}

describe('role enforcement', () => {
  let t: TestServer;
  let viewer: string;
  let editor: string;

  beforeEach(async () => {
    t = await createTestServer({ name: 'roles', authEnabled: true, apiKey: API_KEY });
    await addUser(t, 'viewer@example.com', 'viewer');
    await addUser(t, 'editor@example.com', 'editor');
    viewer = await login(t, 'viewer@example.com');
    editor = await login(t, 'editor@example.com');
  });

  afterEach(async () => {
    await t.close();
  });

  it('lets a viewer read but not change forms, redirects or the sitemap', async () => {
    const as = (cookie: string, method: string, url: string, payload?: unknown) =>
      t.server.inject({ method: method as 'GET', url, headers: { cookie }, payload: payload as object });

    expect((await as(viewer, 'GET', '/api/reverso/forms')).statusCode).toBe(200);
    expect((await as(viewer, 'GET', '/api/reverso/redirects')).statusCode).toBe(200);

    const writes: Array<[string, string, unknown?]> = [
      ['POST', '/api/reverso/forms', { name: 'Contact', slug: 'contact' }],
      ['DELETE', '/api/reverso/forms/some-id'],
      ['PUT', '/api/reverso/forms/some-id/publish', {}],
      ['DELETE', '/api/reverso/forms/some-id/submissions/sub-id'],
      ['POST', '/api/reverso/redirects', { fromPath: '/old', toPath: '/new' }],
      ['DELETE', '/api/reverso/redirects/some-id'],
      ['PUT', '/api/reverso/redirects/some-id/disable', {}],
      ['POST', '/api/reverso/redirects/bulk-import', { redirects: [] }],
      ['POST', '/api/reverso/sitemap/invalidate', {}],
    ];
    for (const [method, url, payload] of writes) {
      const res = await as(viewer, method, url, payload);
      expect(res.statusCode, `${method} ${url}`).toBe(403);
    }
  });

  it('lets an editor write forms and redirects but keeps deletion for admins', async () => {
    const created = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/forms',
      headers: { cookie: editor },
      payload: { name: 'Contact', slug: 'contact' },
    });
    expect(created.statusCode).toBe(200);
    const id = json(created).data.id;

    const del = await t.server.inject({ method: 'DELETE', url: `/api/reverso/forms/${id}`, headers: { cookie: editor } });
    expect(del.statusCode).toBe(403);

    const adminDel = await t.server.inject({
      method: 'DELETE',
      url: `/api/reverso/forms/${id}`,
      headers: { 'x-api-key': API_KEY },
    });
    expect(adminDel.statusCode).toBe(200);
  });
});

describe('login and first-admin bootstrap', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'login-edge', authEnabled: true, apiKey: API_KEY });
  });

  afterEach(async () => {
    await t.close();
  });

  it('matches the email case-insensitively', async () => {
    const reg = await t.server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'Admin@Example.com', password: 'password123', name: 'Admin' },
    });
    expect(reg.statusCode).toBe(201);
    const res = await t.server.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'admin@example.COM', password: 'password123' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('creates exactly one admin when two registrations race', async () => {
    const attempt = (n: number) =>
      t.server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: `admin${n}@example.com`, password: 'password123', name: `Admin ${n}` },
      });
    const results = await Promise.all([attempt(1), attempt(2), attempt(3)]);
    const codes = results.map((r) => r.statusCode).sort();
    expect(codes).toEqual([201, 403, 403]);
  });
});

describe('SVG uploads', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'svg' });
  });

  afterEach(async () => {
    await t.close();
  });

  it('serves uploaded SVG files sandboxed so embedded scripts cannot run on the admin origin', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const upload = multipartFile('evil.svg', 'image/svg+xml', svg);
    const res = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/media',
      headers: upload.headers,
      payload: upload.payload,
    });
    expect(res.statusCode).toBe(200);
    const served = await t.server.inject({ method: 'GET', url: json(res).data.url });
    expect(served.statusCode).toBe(200);
    expect(served.headers['content-security-policy']).toContain('sandbox');
    expect(served.headers['content-security-policy']).toContain("script-src 'none'");
  });

  it('keeps PDFs viewable (no sandbox on passive types)', async () => {
    const pdf = Buffer.from('%PDF-1.4\n%%EOF\n');
    const upload = multipartFile('doc.pdf', 'application/pdf', pdf);
    const res = await t.server.inject({
      method: 'POST',
      url: '/api/reverso/media',
      headers: upload.headers,
      payload: upload.payload,
    });
    expect(res.statusCode).toBe(200);
    const served = await t.server.inject({ method: 'GET', url: json(res).data.url });
    expect(served.headers['content-security-policy']).not.toContain('sandbox');
    expect(served.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('security headers and errors', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('allows external images and the geocoder but no inline scripts in the admin CSP', async () => {
    const server = await createServer({ logger: false });
    const res = await server.inject({ method: 'GET', url: '/health' });
    const csp = String(res.headers['content-security-policy']);
    await server.close();
    expect(csp).toMatch(/img-src [^;]*https:/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/nominatim\.openstreetmap\.org/);
    expect(csp).not.toMatch(/script-src [^;]*'unsafe-inline'/);
  });

  it('refuses an empty cookie secret in production', async () => {
    process.env.NODE_ENV = 'production';
    const saved = process.env.REVERSO_COOKIE_SECRET;
    delete process.env.REVERSO_COOKIE_SECRET;
    try {
      await expect(createServer({ logger: false, cookieSecret: '' })).rejects.toThrow(/REVERSO_COOKIE_SECRET/);
    } finally {
      if (saved !== undefined) process.env.REVERSO_COOKIE_SECRET = saved;
    }
  });

  it('never returns internal error messages in production', async () => {
    process.env.NODE_ENV = 'production';
    const server = await createServer({ logger: false, cookieSecret: 'test-secret-0123456789' });
    server.get('/__boom', async () => {
      throw new Error('SQLITE_CORRUPT: database disk image is malformed at /data/reverso.db');
    });
    const res = await server.inject({ method: 'GET', url: '/__boom' });
    await server.close();
    expect(res.statusCode).toBe(500);
    expect(res.payload).not.toContain('SQLITE');
    expect(res.payload).not.toContain('/data/');
  });
});

describe('SSRF protection', () => {
  it('blocks bracketed IPv6 loopback, mapped IPv4 and carrier-grade NAT', () => {
    for (const url of [
      'http://[::1]:3001/hook',
      'http://[::ffff:7f00:1]/hook',
      'http://[::ffff:127.0.0.1]/hook',
      'http://[fd12::1]/hook',
      'http://[fe80::1]/hook',
      'http://100.64.0.1/hook',
      'http://0x7f000001/hook',
    ]) {
      expect(isUrlSafeForSSRF(url).safe, url).toBe(false);
    }
    expect(isUrlSafeForSSRF('https://hooks.example.com/x').safe).toBe(true);
  });

  it('classifies every IPv6 form that can carry a private IPv4 address', () => {
    for (const ip of [
      '::',
      '::1',
      '0:0:0:0:0:0:0:1',
      '::7f00:1', // IPv4-compatible 127.0.0.1
      '::ffff:7f00:1',
      '::ffff:0:7f00:1', // SIIT-translated
      '64:ff9b::a00:1', // NAT64 of 10.0.0.1
      '64:ff9b:1::1', // local-use NAT64
      '2002:7f00:1::1', // 6to4 of 127.0.0.1
      '2001:0:4136:e378:8000:63bf:3fff:fdd2', // Teredo
      '2001:db8::1', // documentation
      'fc00::1',
      'fe80::1',
      'ff02::1',
    ]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
    for (const ip of ['2606:4700:4700::1111', '2a00:1450:4001:80b::200e', '64:ff9b::808:808', '2002:808:808::1']) {
      expect(isPrivateAddress(ip), ip).toBe(false);
    }
  });

  it('connects only to the address it validated (no DNS rebinding between check and request)', async () => {
    // A name that resolves to a private address must be refused at connect
    // time, even if an earlier check had seen a public one.
    // First answer (seen by an earlier check) was public; the answer at
    // connect time has been rebound to loopback.
    const rebinding = (_host: string, _opts: unknown, cb: (err: Error | null, addr: string, fam: number) => void) =>
      cb(null, '127.0.0.1', 4);
    await assertPublicHost('http://rebind.example.com/x', async () => [{ address: '93.184.216.34', family: 4 }]);
    await expect(
      postToPublicUrl('http://rebind.example.com/x', '{}', {}, { lookup: rebinding, timeoutMs: 2000 })
    ).rejects.toThrow(/private/i);
  });

  it('delivers to a public address resolved at connect time', async () => {
    const received: string[] = [];
    const server = createHttpServer((req, res) => {
      let body = '';
      req.on('data', (c) => {
        body += c;
      });
      req.on('end', () => {
        received.push(body);
        res.end('ok');
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as { port: number }).port;
    // Pretend the public name maps to the local test server, but only via an
    // explicit allow for the test: the lookup returns a "public" address and
    // the socket is redirected to the test server by the allowAddress hook.
    const status = await postToPublicUrl(`http://hooks.example.com:${port}/x`, '{"a":1}', {}, {
      lookup: (_h, _o, cb) => cb(null, '127.0.0.1', 4),
      allowAddress: () => true,
      timeoutMs: 2000,
    });
    await new Promise<void>((r) => server.close(() => r()));
    expect(status).toBe(200);
    expect(received).toEqual(['{"a":1}']);
  });

  it('enforces an overall deadline even when the server keeps trickling bytes', async () => {
    const server = createHttpServer((_req, res) => {
      res.writeHead(200);
      const drip = setInterval(() => res.write('.'), 50);
      res.on('close', () => clearInterval(drip));
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
    const port = (server.address() as { port: number }).port;
    const started = Date.now();
    await expect(
      postToPublicUrl(`http://hooks.example.com:${port}/x`, '{}', {}, {
        lookup: (_h, _o, cb) => cb(null, '127.0.0.1', 4),
        allowAddress: () => true,
        timeoutMs: 400,
      })
    ).rejects.toThrow(/timed out/);
    expect(Date.now() - started).toBeLessThan(2000);
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  });

  it('rejects hostnames that resolve to a private address', async () => {
    const privateLookup = async () => [{ address: '10.0.0.5', family: 4 }];
    await expect(assertPublicHost('http://internal.example.com/x', privateLookup)).rejects.toThrow(/private/i);
    const publicLookup = async () => [{ address: '93.184.216.34', family: 4 }];
    await expect(assertPublicHost('http://example.com/x', publicLookup)).resolves.toBeUndefined();
  });
});

describe('proxy trust', () => {
  const original = process.env.REVERSO_TRUST_PROXY;

  afterEach(() => {
    if (original === undefined) delete process.env.REVERSO_TRUST_PROXY;
    else process.env.REVERSO_TRUST_PROXY = original;
  });

  it('trusts only the configured number of hops so clients cannot spoof their IP', async () => {
    process.env.REVERSO_TRUST_PROXY = '1';
    const server = await createServer({ logger: false });
    server.get('/__ip', async (request) => ({ ip: request.ip }));
    const res = await server.inject({
      method: 'GET',
      url: '/__ip',
      remoteAddress: '10.0.0.1',
      headers: { 'x-forwarded-for': '6.6.6.6, 203.0.113.9' },
    });
    await server.close();
    expect(res.json().ip).toBe('203.0.113.9');
  });
});
