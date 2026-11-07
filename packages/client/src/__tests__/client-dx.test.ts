/**
 * @reverso/client integrator DX: dev warnings, fetch options, request
 * deduplication and media URL rewriting inside rich text.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createReversoClient, resolveMediaUrls } from '../index.js';

type FetchMock = ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('dev warnings when onError is not provided', () => {
  const originalEnv = process.env.NODE_ENV;
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    warn.mockRestore();
    vi.unstubAllGlobals();
  });

  it('logs one warning per failing path with the status and URL', async () => {
    process.env.NODE_ENV = 'development';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => jsonResponse({ success: false }, 404))
    );
    const client = createReversoClient({ url: 'http://cms.test', dedupeMs: 0 });

    await client.getPage('home');
    await client.getPage('home');
    await client.getPage('about');

    expect(warn).toHaveBeenCalledTimes(2);
    const first = String(warn.mock.calls[0]?.[0]);
    expect(first).toContain('404');
    expect(first).toContain('http://cms.test/api/reverso/public/content/page/home');
  });

  it('includes the cause of network errors', async () => {
    process.env.NODE_ENV = 'test';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await createReversoClient({ url: 'http://down.test' }).getPage('home');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('fetch failed');
  });

  it('does not warn in production', async () => {
    process.env.NODE_ENV = 'production';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    await createReversoClient({ url: 'http://down.test' }).getPage('home');
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn when onError is provided', async () => {
    process.env.NODE_ENV = 'development';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const onError = vi.fn();
    await createReversoClient({ url: 'http://down.test', onError }).getPage('home');
    expect(onError).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });
});

describe('fetch options', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        jsonResponse({ success: true, data: { page: 'home', content: {} } })
      );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  function lastInit(): RequestInit & { next?: unknown } {
    const call = fetchMock.mock.calls.at(-1) as [URL, RequestInit & { next?: unknown }];
    return call[1];
  }

  it('sends Next.js revalidate and tags and does not force no-store', async () => {
    await createReversoClient({
      url: 'http://cms.test',
      revalidate: 60,
      tags: ['reverso'],
    }).getPage('home');
    const init = lastInit();
    expect(init.next).toEqual({ revalidate: 60, tags: ['reverso'] });
    expect(init.cache).toBeUndefined();
  });

  it('keeps an explicit cache mode alongside revalidate', async () => {
    await createReversoClient({
      url: 'http://cms.test',
      revalidate: 30,
      cache: 'force-cache',
    }).getPage('home');
    const init = lastInit();
    expect(init.cache).toBe('force-cache');
    expect(init.next).toEqual({ revalidate: 30 });
  });

  it('supports revalidate: false and tags alone', async () => {
    await createReversoClient({ url: 'http://cms.test', revalidate: false }).getPage('home');
    expect(lastInit().next).toEqual({ revalidate: false });
    expect(lastInit().cache).toBeUndefined();

    await createReversoClient({ url: 'http://cms.test', tags: ['a'] }).getPage('home');
    expect(lastInit().next).toEqual({ tags: ['a'] });
    expect(lastInit().cache).toBe('no-store');
  });

  it('omits next when neither revalidate nor tags is set', async () => {
    await createReversoClient({ url: 'http://cms.test' }).getPage('home');
    expect(lastInit().next).toBeUndefined();
    expect(lastInit().cache).toBe('no-store');
  });

  it('merges extra headers, keeping accept unless overridden', async () => {
    await createReversoClient({
      url: 'http://cms.test',
      headers: { authorization: 'Bearer x' },
    }).getPage('home');
    expect(lastInit().headers).toEqual({ accept: 'application/json', authorization: 'Bearer x' });
  });
});

describe('request deduplication', () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = vi
      .fn()
      .mockImplementation(async () =>
        jsonResponse({ success: true, data: { page: 'home', content: { 'home.a': 'A' } } })
      );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shares one request between concurrent getPage calls for the same slug', async () => {
    const client = createReversoClient({ url: 'http://cms.test' });
    const pages = await Promise.all([
      client.getPage('home'),
      client.getPage('home'),
      client.getPage('home'),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const page of pages) expect(page.get('home.a', '')).toBe('A');
  });

  it('reuses a settled result within the TTL and refetches after it', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const client = createReversoClient({ url: 'http://cms.test', dedupeMs: 1000 });
    await client.getPage('home');
    await client.getPage('home');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(Date.now() + 1500);
    await client.getPage('home');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not share requests across slugs or clients', async () => {
    const client = createReversoClient({ url: 'http://cms.test' });
    await Promise.all([client.getPage('home'), client.getPage('about')]);
    await createReversoClient({ url: 'http://cms.test' }).getPage('home');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('can be disabled with dedupeMs: 0', async () => {
    const client = createReversoClient({ url: 'http://cms.test', dedupeMs: 0 });
    await Promise.all([client.getPage('home'), client.getPage('home')]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures beyond the in-flight request', async () => {
    fetchMock.mockReset();
    fetchMock
      .mockImplementationOnce(async () => jsonResponse({ success: false }, 503))
      .mockImplementation(async () =>
        jsonResponse({ success: true, data: { page: 'home', content: { 'home.a': 'A' } } })
      );
    const client = createReversoClient({ url: 'http://cms.test', onError: () => {} });
    expect((await client.getPage('home')).content).toEqual({});
    expect((await client.getPage('home')).get('home.a', '')).toBe('A');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('media URLs inside rich text', () => {
  it('rewrites src/href attributes with double and single quotes', () => {
    const html =
      '<p><img src="/uploads/a.png" alt="x"><a href=\'/uploads/doc.pdf\'>doc</a> <a href="/about">about</a></p>';
    expect(resolveMediaUrls(html, 'http://cms.test')).toBe(
      '<p><img src="http://cms.test/uploads/a.png" alt="x"><a href=\'http://cms.test/uploads/doc.pdf\'>doc</a> <a href="/about">about</a></p>'
    );
  });

  it('rewrites markdown links and images', () => {
    const md = '![hero](/uploads/hero.jpg) and [the pdf](/uploads/a.pdf "title") but [home](/)';
    expect(resolveMediaUrls(md, 'http://cms.test/')).toBe(
      '![hero](http://cms.test/uploads/hero.jpg) and [the pdf](http://cms.test/uploads/a.pdf "title") but [home](/)'
    );
  });

  it('rewrites poster attributes and leaves absolute URLs alone', () => {
    const html = '<video poster="/uploads/p.jpg" src="https://cdn.test/uploads/v.mp4"></video>';
    expect(resolveMediaUrls(html, 'http://cms.test')).toBe(
      '<video poster="http://cms.test/uploads/p.jpg" src="https://cdn.test/uploads/v.mp4"></video>'
    );
  });

  it('applies inside nested content values', () => {
    const value = { 'p.s.body': '<img src="/uploads/x.png">' };
    expect(resolveMediaUrls(value, 'http://cms.test')).toEqual({
      'p.s.body': '<img src="http://cms.test/uploads/x.png">',
    });
  });
});
