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

    it('accepts a mutation from behind a proxy that rewrites Host', async () => {
      // nginx's default (and the admin's dev proxy) replace Host with the
      // upstream address while the browser still sends its own Origin.
      // Comparing Origin against the raw Host turned every save into a 403.
      const proxied = await createTestServer({
        name: 'auth-proxy',
        authEnabled: true,
        apiKey: API_KEY,
        trustProxy: true,
      });
      try {
        // Behind a proxy the peer address says nothing about who is calling,
        // so the first admin needs the deliberate opt-in.
        process.env.REVERSO_ALLOW_BOOTSTRAP = 'true';
        const register = await proxied.server.inject({
          method: 'POST',
          url: '/auth/register',
          payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
        });
        delete process.env.REVERSO_ALLOW_BOOTSTRAP;
        const cookie = sessionCookie(register);
        await proxied.server.inject({
          method: 'POST',
          url: '/api/reverso/schema/sync',
          headers: { 'x-api-key': API_KEY },
          payload: { schema: HOME_SCHEMA },
        });

        const res = await proxied.server.inject({
          method: 'PATCH',
          url: '/api/reverso/content/page/home',
          headers: {
            cookie,
            origin: 'https://cms.example.com',
            host: 'localhost:3001',
            'x-forwarded-host': 'cms.example.com',
          },
          payload: { data: { 'home.hero.title': 'through the proxy' } },
        });
        expect(res.statusCode).toBe(200);
      } finally {
        delete process.env.REVERSO_ALLOW_BOOTSTRAP;
        await proxied.close();
      }
    });

    it('accepts a mutation from an origin the CORS setting allows', async () => {
      const allowed = await createTestServer({
        name: 'auth-cors',
        authEnabled: true,
        apiKey: API_KEY,
        corsOrigin: 'https://cms.example.com/',
      });
      try {
        const register = await allowed.server.inject({
          method: 'POST',
          url: '/auth/register',
          payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
        });
        const cookie = sessionCookie(register);
        await allowed.server.inject({
          method: 'POST',
          url: '/api/reverso/schema/sync',
          headers: { 'x-api-key': API_KEY },
          payload: { schema: HOME_SCHEMA },
        });

        const res = await allowed.server.inject({
          method: 'PATCH',
          url: '/api/reverso/content/page/home',
          headers: { cookie, origin: 'https://cms.example.com', host: 'localhost:3001' },
          payload: { data: { 'home.hero.title': 'allowed' } },
        });
        expect(res.statusCode).toBe(200);

        const other = await allowed.server.inject({
          method: 'PATCH',
          url: '/api/reverso/content/page/home',
          headers: { cookie, origin: 'https://evil.example', host: 'localhost:3001' },
          payload: { data: { 'home.hero.title': 'nope' } },
        });
        expect(other.statusCode).toBe(403);
      } finally {
        await allowed.close();
      }
    });

    it('lets the API key through even when a stale cookie looks cross-site', async () => {
      const { cookie } = await registerAdmin();

      const res = await t.server.inject({
        method: 'POST',
        url: '/api/reverso/schema/sync',
        headers: { cookie, 'x-api-key': API_KEY, origin: 'https://evil.example', host: 'localhost:3001' },
        payload: { schema: HOME_SCHEMA },
      });

      // No browser attaches an API key by itself, so CSRF cannot forge this.
      expect(res.statusCode).toBe(200);
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

    it('locks an address that sprays guesses across many accounts', async () => {
      await registerAdmin();
      // A fresh email per attempt never trips the per-account bucket; the
      // per-IP bucket must still stop the source (ceiling of 20 per window).
      let last = 0;
      let attempts = 0;
      for (; attempts < 30 && last !== 429; attempts++) {
        const res = await t.server.inject({
          method: 'POST',
          url: '/auth/login',
          payload: { email: `user${attempts}@example.com`, password: 'wrong-password' },
        });
        expect([401, 429]).toContain(res.statusCode);
        last = res.statusCode;
      }
      expect(last).toBe(429);
      expect(attempts).toBeLessThanOrEqual(21);
      expect(json(await t.server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'admin@example.com', password: 'password123' },
      })).message).toMatch(/from this address/);
    });

    it('one locked account does not lock the others', async () => {
      await registerAdmin();
      for (let i = 0; i < 6; i++) {
        await t.server.inject({
          method: 'POST',
          url: '/auth/login',
          payload: { email: 'victim@example.com', password: 'wrong-password' },
        });
      }
      const victim = await t.server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'victim@example.com', password: 'wrong-password' },
      });
      expect(victim.statusCode).toBe(429);
      const admin = await t.server.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'admin@example.com', password: 'password123' },
      });
      expect(admin.statusCode).toBe(200);
    });

    it('a lockout from one address does not lock the owner out everywhere', async () => {
      // The account bucket is keyed by address as well, so five wrong
      // guesses from a stranger must not become a denial of service against
      // the real owner signing in from somewhere else.
      await registerAdmin();
      for (let i = 0; i < 6; i++) {
        await t.server.inject({
          method: 'POST',
          url: '/auth/login',
          remoteAddress: '203.0.113.5',
          payload: { email: 'admin@example.com', password: 'wrong-password' },
        });
      }
      const attacker = await t.server.inject({
        method: 'POST',
        url: '/auth/login',
        remoteAddress: '203.0.113.5',
        payload: { email: 'admin@example.com', password: 'password123' },
      });
      expect(attacker.statusCode).toBe(429);

      const owner = await t.server.inject({
        method: 'POST',
        url: '/auth/login',
        remoteAddress: '198.51.100.7',
        payload: { email: 'admin@example.com', password: 'password123' },
      });
      expect(owner.statusCode).toBe(200);
    });
  });

  describe('first-admin bootstrap', () => {
    it('refuses to create the first admin from a remote address', async () => {
      const res = await t.server.inject({
        method: 'POST',
        url: '/auth/register',
        remoteAddress: '203.0.113.5',
        payload: { email: 'stranger@example.com', password: 'password123', name: 'Stranger' },
      });
      expect(res.statusCode).toBe(403);

      const status = await t.server.inject({
        method: 'GET',
        url: '/auth/setup-status',
        remoteAddress: '203.0.113.5',
      });
      expect(json(status).needsSetup).toBe(true);
      expect(json(status).canRegister).toBe(false);
    });

    it('allows it from the machine running the server', async () => {
      const res = await t.server.inject({
        method: 'POST',
        url: '/auth/register',
        remoteAddress: '127.0.0.1',
        payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
      });
      expect(res.statusCode).toBe(201);
    });

    it('cannot be talked into it with a forged X-Forwarded-For', async () => {
      // With trustProxy on, request.ip comes from the header the caller
      // wrote, so locality must never be read from it.
      const behindProxy = await createTestServer({
        name: 'auth-bootstrap-proxy',
        authEnabled: true,
        apiKey: API_KEY,
        trustProxy: true,
      });
      try {
        const res = await behindProxy.server.inject({
          method: 'POST',
          url: '/auth/register',
          remoteAddress: '203.0.113.5',
          headers: { 'x-forwarded-for': '127.0.0.1' },
          payload: { email: 'stranger@example.com', password: 'password123', name: 'Stranger' },
        });
        expect(res.statusCode).toBe(403);
      } finally {
        await behindProxy.close();
      }
    });

    it('allows a remote address when the operator opts in', async () => {
      process.env.REVERSO_ALLOW_BOOTSTRAP = 'true';
      try {
        const res = await t.server.inject({
          method: 'POST',
          url: '/auth/register',
          remoteAddress: '203.0.113.5',
          payload: { email: 'admin@example.com', password: 'password123', name: 'Admin' },
        });
        expect(res.statusCode).toBe(201);
      } finally {
        delete process.env.REVERSO_ALLOW_BOOTSTRAP;
      }
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
