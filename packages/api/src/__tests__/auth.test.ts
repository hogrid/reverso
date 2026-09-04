/**
 * Authentication integration tests (auth ENABLED, as in every real run).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HOME_SCHEMA, createTestServer, json, sessionCookie, type TestServer } from './helpers.js';

const API_KEY = 'test-api-key-0123456789abcdef';

describe('authentication', () => {
  let t: TestServer;

  beforeEach(async () => {
    t = await createTestServer({ name: 'auth', authEnabled: true, apiKey: API_KEY });
  });

  afterEach(async () => {
    await t.close();
  });

  async function registerAdmin(): Promise<{ cookie: string; token: string }> {
    const res = await t.server.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
    });
    expect(res.statusCode).toBe(201);
    return { cookie: sessionCookie(res), token: json(res).session.token };
  }

  describe('public surface', () => {
    it('serves /health, prefixed health, the admin shell and public content without credentials', async () => {
      await t.server.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        headers: { 'x-api-key': API_KEY },
        payload: { schema: HOME_SCHEMA },
      });
      for (const url of [
        '/health',
        '/api/reverso/health',
        '/auth/setup-status',
        '/api/reverso/public/content/page/home',
        '/api/reverso/sitemap.xml',
      ]) {
        const res = await t.server.inject({ method: 'GET', url });
        expect(res.statusCode, url).toBe(200);
      }
    });

    it('rejects every protected route without credentials', async () => {
      const attempts = [
        { method: 'GET', url: '/api/reverso/pages' },
        { method: 'GET', url: '/api/reverso/schema' },
        { method: 'POST', url: '/api/reverso/schema/sync', payload: { schema: HOME_SCHEMA } },
        { method: 'PATCH', url: '/api/reverso/content/page/home', payload: { data: {} } },
        { method: 'GET', url: '/api/reverso/forms' },
        { method: 'GET', url: '/api/reverso/redirects' },
        { method: 'GET', url: '/api/reverso/media' },
      ] as const;

      for (const attempt of attempts) {
        const res = await t.server.inject(attempt);
        expect(res.statusCode, `${attempt.method} ${attempt.url}`).toBe(401);
        expect(json(res).success).toBe(false);
      }
    });

    it('ignores the query string when matching public paths', async () => {
      await t.server.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        headers: { 'x-api-key': API_KEY },
        payload: { schema: HOME_SCHEMA },
      });
      const res = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/public/content/page/home?locale=default',
      });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('API key', () => {
    it('accepts X-API-Key and Bearer forms of the configured key as admin', async () => {
      const viaHeader = await t.server.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        headers: { 'x-api-key': API_KEY },
        payload: { schema: HOME_SCHEMA },
      });
      expect(viaHeader.statusCode).toBe(200);

      const viaBearer = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/pages',
        headers: { authorization: `Bearer ${API_KEY}` },
      });
      expect(viaBearer.statusCode).toBe(200);
      expect(json(viaBearer).data).toHaveLength(1);
    });

    it('rejects a wrong or malformed key', async () => {
      const wrong = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/pages',
        headers: { 'x-api-key': 'not-the-key-0123456789' },
      });
      expect(wrong.statusCode).toBe(401);

      const short = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/pages',
        headers: { authorization: 'Bearer abc' },
      });
      expect(short.statusCode).toBe(401);
    });
  });

  describe('session', () => {
    it('registers the first user as admin and sets an httpOnly cookie', async () => {
      const res = await t.server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
      });
      expect(res.statusCode).toBe(201);
      expect(json(res).user.role).toBe('admin');
      const cookie = res.headers['set-cookie'];
      const header = Array.isArray(cookie) ? cookie[0] : cookie;
      expect(header).toMatch(/reverso_session=/);
      expect(header).toMatch(/HttpOnly/i);
      expect(header).toMatch(/SameSite=Lax/i);
    });

    it('closes registration after the first user', async () => {
      await registerAdmin();
      const status = await t.server.inject({ method: 'GET', url: '/auth/setup-status' });
      expect(json(status).canRegister).toBe(false);

      const second = await t.server.inject({
        method: 'POST',
        url: '/auth/register',
        payload: { email: 'other@example.com', password: 'password123', name: 'Other' },
      });
      expect(second.statusCode).toBe(403);
    });

    it('authenticates protected routes with the session cookie', async () => {
      const { cookie } = await registerAdmin();

      const sync = await t.server.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        headers: { cookie },
        payload: { schema: HOME_SCHEMA },
      });
      expect(sync.statusCode).toBe(200);

      const save = await t.server.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/home',
        headers: { cookie },
        payload: { data: { 'home.hero.title': 'From cookie' } },
      });
      expect(save.statusCode).toBe(200);

      const pub = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/public/content/home.hero.title',
      });
      expect(json(pub).data.value).toBe('From cookie');
    });

    it('accepts the session token as a Bearer token too', async () => {
      const { token } = await registerAdmin();
      const res = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/pages',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('rejects cookie-authenticated mutations coming from another origin', async () => {
      const { cookie } = await registerAdmin();
      await t.server.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        headers: { cookie },
        payload: { schema: HOME_SCHEMA },
      });

      const crossSite = await t.server.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/home',
        headers: { cookie, origin: 'https://evil.example', host: 'localhost:3001' },
        payload: { data: { 'home.hero.title': 'csrf' } },
      });
      expect(crossSite.statusCode).toBe(403);

      const sameSite = await t.server.inject({
        method: 'PATCH',
        url: '/api/reverso/content/page/home',
        headers: { cookie, origin: 'http://localhost:3001', host: 'localhost:3001' },
        payload: { data: { 'home.hero.title': 'ok' } },
      });
      expect(sameSite.statusCode).toBe(200);
    });

    it('invalidates the session on logout', async () => {
      const { cookie } = await registerAdmin();
      const logout = await t.server.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { cookie },
      });
      expect(logout.statusCode).toBe(200);

      const after = await t.server.inject({
        method: 'GET',
        url: '/api/reverso/pages',
        headers: { cookie },
      });
      expect(after.statusCode).toBe(401);
    });

    it('locks out repeated failed logins', async () => {
      await registerAdmin();
      let last = 0;
      for (let i = 0; i < 10 && last !== 429; i++) {
        const res = await t.server.inject({
          method: 'POST',
          url: '/auth/login',
          payload: { email: 'admin@example.com', password: 'wrong-password' },
        });
        expect([401, 429]).toContain(res.statusCode);
        last = res.statusCode;
      }
      expect(last).toBe(429);
    });
  });

  describe('disabled auth (explicit opt-out)', () => {
    it('treats every request as admin', async () => {
      const open = await createTestServer({ name: 'auth-off', authEnabled: false });
      try {
        const res = await open.server.inject({ method: 'GET', url: '/api/reverso/pages' });
        expect(res.statusCode).toBe(200);
      } finally {
        await open.close();
      }
    });
  });
});

describe('cookie security policy', () => {
  const saved = process.env.REVERSO_COOKIE_SECURE;
  afterEach(() => {
    if (saved === undefined) delete process.env.REVERSO_COOKIE_SECURE;
    else process.env.REVERSO_COOKIE_SECURE = saved;
  });

  async function registerAndReadCookie(t: TestServer, headers: Record<string, string> = {}) {
    const res = await t.server.inject({
      method: 'POST',
      url: '/auth/register',
      headers,
      payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
    });
    const raw = res.headers['set-cookie'];
    return Array.isArray(raw) ? raw[0] ?? '' : String(raw ?? '');
  }

  it('auto: the cookie is Secure only when the request came over https', async () => {
    delete process.env.REVERSO_COOKIE_SECURE;
    const plain = await createTestServer({ name: 'cookie-plain', authEnabled: true });
    try {
      expect(await registerAndReadCookie(plain)).not.toMatch(/;\s*Secure/i);
    } finally {
      await plain.close();
    }
  });

  it('true: always Secure; false: never', async () => {
    process.env.REVERSO_COOKIE_SECURE = 'true';
    const strict = await createTestServer({ name: 'cookie-true', authEnabled: true });
    try {
      expect(await registerAndReadCookie(strict)).toMatch(/;\s*Secure/i);
    } finally {
      await strict.close();
    }
    process.env.REVERSO_COOKIE_SECURE = 'false';
    const lax = await createTestServer({ name: 'cookie-false', authEnabled: true });
    try {
      expect(await registerAndReadCookie(lax)).not.toMatch(/;\s*Secure/i);
    } finally {
      await lax.close();
    }
  });
});
