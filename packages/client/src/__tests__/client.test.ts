/**
 * @reverso/client tests: request shape, fallbacks and failure reporting.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReversoClient, mediaUrl, resolveMediaUrls } from '../index.js';

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

describe('value contract', () => {
  const content = {
    'p.s.image': { url: '/uploads/a.png', alt: 'A', width: 10, height: 20 },
    'p.s.file': { url: '/uploads/doc.pdf', filename: 'doc.pdf', size: 3, mimeType: 'application/pdf' },
    'p.s.gallery': [{ url: '/1.png' }, { url: '/2.png', alt: 'two' }, { nope: true }],
    'p.s.map': { lat: -23.55, lng: -46.63, address: 'São Paulo' },
    'p.s.code': { code: 'console.log(1)', language: 'ts' },
    'p.s.tags': ['a', 'b'],
    'p.s.csv': 'x, y ,z',
    'p.s.num': '42',
    'p.s.bool': 'true',
    'p.s.legacyMap': '1.5,2.5',
    'p.s.$': [{ title: 'Item', avatar: { url: '/av.png' } }],
  } as Record<string, unknown>;

  let page: Awaited<ReturnType<ReturnType<typeof createReversoClient>['getPage']>>;

  beforeEach(async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { page: 'p', content } }));
    vi.stubGlobal('fetch', fetchMock);
    // Media URL rewriting has its own suite below; keep stored paths here.
    page = await createReversoClient({ url: 'http://cms.test', mediaBaseUrl: false }).getPage('p');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('get() with a string fallback never returns an object', () => {
    expect(page.get('p.s.image', '/fallback.png')).toBe('/uploads/a.png');
    expect(page.get('p.s.file', '/f.pdf')).toBe('/uploads/doc.pdf');
    expect(page.get('p.s.map', '0,0')).toBe('-23.55,-46.63');
    expect(page.get('p.s.code', '')).toBe('console.log(1)');
    expect(page.get('p.s.tags', '')).toBe('a, b');
    expect(page.get('p.s.num', '')).toBe('42');
  });

  it('get() coerces to numbers and booleans when the fallback is one', () => {
    expect(page.get('p.s.num', 0)).toBe(42);
    expect(page.get('p.s.bool', false)).toBe(true);
    expect(page.get('p.s.missing', 7)).toBe(7);
    expect(page.get('p.s.image', 0)).toBe(0);
  });

  it('exposes typed accessors for rich fields', () => {
    expect(page.image('p.s.image')).toEqual({ url: '/uploads/a.png', alt: 'A', width: 10, height: 20 });
    expect(page.image('p.s.missing')).toBeNull();
    expect(page.file('p.s.file')?.filename).toBe('doc.pdf');
    expect(page.images('p.s.gallery')).toEqual([{ url: '/1.png' }, { url: '/2.png', alt: 'two' }]);
    expect(page.images('p.s.missing', [{ url: '/x.png' }])).toEqual([{ url: '/x.png' }]);
    expect(page.map('p.s.map')).toMatchObject({ lat: -23.55, lng: -46.63, address: 'São Paulo' });
    expect(page.map('p.s.legacyMap')).toEqual({ lat: 1.5, lng: 2.5 });
    expect(page.code('p.s.code')).toEqual({ code: 'console.log(1)', language: 'ts' });
    expect(page.list('p.s.tags')).toEqual(['a', 'b']);
    expect(page.list('p.s.csv')).toEqual(['x', 'y', 'z']);
    expect(page.get('p.s.tags', [] as string[])).toEqual(['a', 'b']);
  });

  it('mediaUrl() works on repeater item values', () => {
    const [item] = page.items('p.s');
    expect(mediaUrl(item?.avatar, '/placeholder.png')).toBe('/av.png');
    expect(mediaUrl(undefined, '/placeholder.png')).toBe('/placeholder.png');
    expect(mediaUrl('/direct.png')).toBe('/direct.png');
  });
});

describe('media URL resolution', () => {
  const content = {
    'p.s.image': { url: '/uploads/a.png', alt: 'A' },
    'p.s.gallery': [{ url: '/uploads/1.png' }, { url: 'https://cdn.example.com/2.png' }],
    'p.s.video': '/uploads/promo.mp4',
    'p.s.link': '/about',
    'p.s.$': [{ title: 'Item', avatar: { url: '/uploads/av.png' } }],
  } as Record<string, unknown>;

  function mockPage() {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { page: 'p', content } })));
  }

  afterEach(() => vi.unstubAllGlobals());

  it('rewrites relative upload paths to absolute URLs on the CMS by default', async () => {
    mockPage();
    const page = await createReversoClient({ url: 'http://cms.test/' }).getPage('p');
    expect(page.image('p.s.image')?.url).toBe('http://cms.test/uploads/a.png');
    expect(page.get('p.s.image', '')).toBe('http://cms.test/uploads/a.png');
    expect(page.images('p.s.gallery').map((i) => i.url)).toEqual([
      'http://cms.test/uploads/1.png',
      'https://cdn.example.com/2.png',
    ]);
    expect(page.get('p.s.video', '')).toBe('http://cms.test/uploads/promo.mp4');
    expect(mediaUrl(page.items('p.s')[0]?.avatar)).toBe('http://cms.test/uploads/av.png');
  });

  it('leaves other relative paths alone', async () => {
    mockPage();
    const page = await createReversoClient({ url: 'http://cms.test' }).getPage('p');
    expect(page.get('p.s.link', '')).toBe('/about');
  });

  it('honours mediaBaseUrl and can be switched off', async () => {
    mockPage();
    const cdn = await createReversoClient({ url: 'http://cms.test', mediaBaseUrl: 'https://cdn.test/' }).getPage('p');
    expect(cdn.image('p.s.image')?.url).toBe('https://cdn.test/uploads/a.png');

    mockPage();
    const raw = await createReversoClient({ url: 'http://cms.test', mediaBaseUrl: false }).getPage('p');
    expect(raw.image('p.s.image')?.url).toBe('/uploads/a.png');
  });

  it('applies to single values too', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true, data: { value: { url: '/uploads/x.pdf' } } })));
    const value = await createReversoClient({ url: 'http://cms.test' }).getValue('p.s.file', '');
    expect(value).toBe('http://cms.test/uploads/x.pdf');
  });

  it('resolveMediaUrls returns the same object when nothing changes', () => {
    const input = { a: 'x', b: [1, 2] };
    expect(resolveMediaUrls(input, 'http://cms.test')).toBe(input);
  });
});
