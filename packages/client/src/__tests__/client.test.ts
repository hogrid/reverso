/**
 * @reverso/client tests: request shape, fallbacks and failure reporting.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReversoClient } from '../index.js';

type FetchMock = ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createReversoClient', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getPage', () => {
    it('calls the public page endpoint and exposes typed accessors', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: {
            page: 'home',
            content: {
              'home.hero.title': 'Hello',
              'home.hero.count': 3,
              'home.features.$': [{ title: 'A' }, { title: 'B' }],
            },
          },
        })
      );

      const client = createReversoClient({ url: 'http://cms.test/' });
      const page = await client.getPage('home');

      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect(url.toString()).toBe('http://cms.test/api/reverso/public/content/page/home');
      expect(init.cache).toBe('no-store');
      expect((init.headers as Record<string, string>).accept).toBe('application/json');

      expect(page.slug).toBe('home');
      expect(page.get('home.hero.title', 'fallback')).toBe('Hello');
      expect(page.get<number>('home.hero.count', 0)).toBe(3);
      expect(page.get('home.hero.missing', 'fallback')).toBe('fallback');
      expect(page.items('home.features')).toEqual([{ title: 'A' }, { title: 'B' }]);
      expect(page.items('home.team', [{ name: 'x' }])).toEqual([{ name: 'x' }]);
    });

    it('treats empty strings and nulls as missing', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { page: 'home', content: { 'home.hero.title': '', 'home.hero.sub': null } },
        })
      );
      const page = await createReversoClient({ url: 'http://cms.test' }).getPage('home');
      expect(page.get('home.hero.title', 'A')).toBe('A');
      expect(page.get('home.hero.sub', 'B')).toBe('B');
    });

    it('adds the locale and honours the cache option', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { page: 'home', content: {} } }));
      await createReversoClient({ url: 'http://cms.test', locale: 'pt-BR', cache: 'force-cache' }).getPage(
        'home'
      );
      const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect(url.searchParams.get('locale')).toBe('pt-BR');
      expect(init.cache).toBe('force-cache');
    });

    it('encodes the slug', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { page: 'a b', content: {} } }));
      await createReversoClient({ url: 'http://cms.test' }).getPage('a b');
      const [url] = fetchMock.mock.calls[0] as [URL];
      expect(url.pathname).toBe('/api/reverso/public/content/page/a%20b');
    });
  });

  describe('failure modes', () => {
    it('falls back to empty content when the API is unreachable and reports via onError', async () => {
      const cause = new TypeError('fetch failed');
      fetchMock.mockRejectedValueOnce(cause);
      const onError = vi.fn();

      const page = await createReversoClient({ url: 'http://down.test', onError }).getPage('home');

      expect(page.content).toEqual({});
      expect(page.get('home.hero.title', 'fallback')).toBe('fallback');
      expect(onError).toHaveBeenCalledWith({ path: '/api/reverso/public/content/page/home', cause });
    });

    it('falls back on non-2xx responses and reports the status', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: false }, 503));
      const onError = vi.fn();

      const page = await createReversoClient({ url: 'http://cms.test', onError }).getPage('home');

      expect(page.content).toEqual({});
      expect(onError).toHaveBeenCalledWith({ path: '/api/reverso/public/content/page/home', status: 503 });
    });

    it('falls back when the body is not JSON', async () => {
      fetchMock.mockResolvedValueOnce(new Response('<html>502</html>', { status: 200 }));
      const onError = vi.fn();
      const page = await createReversoClient({ url: 'http://cms.test', onError }).getPage('home');
      expect(page.content).toEqual({});
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('never throws when onError is not provided', async () => {
      fetchMock.mockRejectedValueOnce(new Error('boom'));
      await expect(createReversoClient({ url: 'http://cms.test' }).getPage('home')).resolves.toBeDefined();
    });

    it('passes a timeout signal to fetch', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ success: true, data: { page: 'home', content: {} } }));
      await createReversoClient({ url: 'http://cms.test', timeoutMs: 1234 }).getPage('home');
      const [, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
      expect(init.signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('getValue', () => {
    it('returns the published value or the fallback', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ success: true, data: { value: 'Live' } }))
        .mockResolvedValueOnce(jsonResponse({ success: false }, 404));

      const client = createReversoClient({ url: 'http://cms.test' });
      expect(await client.getValue('home.hero.title', 'fallback')).toBe('Live');
      expect(await client.getValue('home.hero.title', 'fallback')).toBe('fallback');

      const [url] = fetchMock.mock.calls[0] as [URL];
      expect(url.pathname).toBe('/api/reverso/public/content/home.hero.title');
    });
  });
});
