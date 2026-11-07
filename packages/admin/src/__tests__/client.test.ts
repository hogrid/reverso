/**
 * ApiClient request shaping: headers, bodies, downloads and upload timeouts.
 * fetch is stubbed globally so each test can inspect the exact RequestInit.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, uploadTimeoutMs } from '../api/client';

type FetchArgs = [string, RequestInit];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonResponse({ success: true, data: {} }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const lastCall = () => fetchMock.mock.calls.at(-1) as FetchArgs;
const headersOf = (init: RequestInit) => new Headers(init.headers);

describe('apiClient content-type handling', () => {
  it('does not send Content-Type on a body-less PUT (Fastify rejects empty JSON bodies)', async () => {
    await apiClient.put('/api/reverso/forms/1/publish');
    const [, init] = lastCall();
    expect(init.method).toBe('PUT');
    expect(init.body).toBeUndefined();
    expect(headersOf(init).has('content-type')).toBe(false);
  });

  it('does not send Content-Type on a body-less POST', async () => {
    await apiClient.post('/api/reverso/redirects/1/enable');
    const [, init] = lastCall();
    expect(init.body).toBeUndefined();
    expect(headersOf(init).has('content-type')).toBe(false);
  });

  it('does not send Content-Type on GET and DELETE', async () => {
    await apiClient.get('/x');
    expect(headersOf(lastCall()[1]).has('content-type')).toBe(false);
    await apiClient.delete('/x');
    expect(headersOf(lastCall()[1]).has('content-type')).toBe(false);
  });

  it('sends JSON with Content-Type when there is a body', async () => {
    await apiClient.post('/x', { a: 1 });
    const [, init] = lastCall();
    expect(init.body).toBe('{"a":1}');
    expect(headersOf(init).get('content-type')).toBe('application/json');
  });

  it('serialises falsy-but-present bodies instead of dropping them', async () => {
    await apiClient.put('/x', false);
    const [, init] = lastCall();
    expect(init.body).toBe('false');
    expect(headersOf(init).get('content-type')).toBe('application/json');
  });

  it('always includes credentials', async () => {
    await apiClient.put('/x');
    expect(lastCall()[1].credentials).toBe('include');
  });

  it('throws an ApiError carrying the server message', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, error: 'Bad Request', message: 'nope' }, 400)
    );
    await expect(apiClient.put('/x')).rejects.toMatchObject({
      error: 'Bad Request',
      message: 'nope',
      statusCode: 400,
    });
  });
});

describe('apiClient.download', () => {
  it('POSTs without a body and returns the payload with the server filename', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('ID,Status\n1,new', {
        status: 200,
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename="contact-submissions.csv"',
        },
      })
    );
    const file = await apiClient.download('/api/reverso/forms/1/submissions/export', {
      method: 'POST',
      fallbackFilename: 'export.csv',
    });
    const [url, init] = lastCall();
    expect(url).toBe('/api/reverso/forms/1/submissions/export');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(headersOf(init).has('content-type')).toBe(false);
    expect(file.filename).toBe('contact-submissions.csv');
    expect(await file.blob.text()).toBe('ID,Status\n1,new');
  });

  it('falls back to the given filename and rejects with the API message on error', async () => {
    fetchMock.mockResolvedValueOnce(new Response('a,b', { status: 200 }));
    const file = await apiClient.download('/x', { method: 'POST', fallbackFilename: 'f.csv' });
    expect(file.filename).toBe('f.csv');

    fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: false, error: 'Not found', message: 'Form missing' }, 404)
    );
    await expect(apiClient.download('/x', { method: 'POST' })).rejects.toMatchObject({
      message: 'Form missing',
      statusCode: 404,
    });
  });
});

describe('upload timeout', () => {
  it('scales with file size: 30s base + 1s per MB, capped at 10 minutes', () => {
    expect(uploadTimeoutMs(0)).toBe(30_000);
    expect(uploadTimeoutMs(50 * 1024 * 1024)).toBe(80_000);
    expect(uploadTimeoutMs(10 * 1024 * 1024 * 1024)).toBe(600_000);
  });

  it('uses the size-based timeout instead of the 10s request cap', async () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    const fd = new FormData();
    fd.append('file', new File([new Uint8Array(2 * 1024 * 1024)], 'big.bin'));
    await apiClient.upload('/api/reverso/media', fd);
    expect(spy).toHaveBeenCalledWith(32_000);
    const [, init] = lastCall();
    expect(headersOf(init).has('content-type')).toBe(false);
  });
});
