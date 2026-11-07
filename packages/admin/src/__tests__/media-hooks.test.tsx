/**
 * Media hooks against the real API contract:
 * GET /media -> { success, data: Media[], meta: { total, limit, offset } }
 * POST /media/bulk-delete { ids } -> { success, data: { deleted, missing } }
 */

import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBulkDeleteMedia, useInfiniteMedia } from '../api/hooks/useMedia';
import { createTestQueryClient, renderHook, waitFor, withQueryClient } from './render-helpers';

const item = (id: string) => ({
  id,
  url: `/uploads/${id}.gif`,
  filename: `${id}.gif`,
  mimeType: 'image/gif',
  size: 1,
  createdAt: '',
  updatedAt: '',
});

let fetchMock: ReturnType<typeof vi.fn>;

function respond(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, 'http://localhost');
    if (url.pathname.endsWith('/media/bulk-delete')) {
      return respond({ success: true, data: { deleted: 2, missing: [] } });
    }
    const limit = Number(url.searchParams.get('limit'));
    const offset = Number(url.searchParams.get('offset'));
    const total = 5;
    const ids = Array.from({ length: total }, (_, i) => `m${i}`).slice(offset, offset + limit);
    return respond({ success: true, data: ids.map(item), meta: { total, limit, offset } });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('useInfiniteMedia', () => {
  it('reads { data, meta } and loads further offsets until total is reached', async () => {
    const client = createTestQueryClient();
    const { result, rendered } = renderHook(
      () => useInfiniteMedia({ pageSize: 2, search: 'm' }),
      withQueryClient(client)
    );
    await rendered;
    await waitFor(() => result.current.isSuccess);

    expect(result.current.items.map((m) => m.id)).toEqual(['m0', 'm1']);
    expect(result.current.total).toBe(5);
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      await result.current.fetchNextPage();
    });
    await act(async () => {
      await result.current.fetchNextPage();
    });
    await waitFor(() => result.current.items.length === 5);
    expect(result.current.items.map((m) => m.id)).toEqual(['m0', 'm1', 'm2', 'm3', 'm4']);
    expect(result.current.hasNextPage).toBe(false);

    const offsets = fetchMock.mock.calls.map(
      ([u]) => new URL(u as string, 'http://localhost').searchParams.get('offset')
    );
    expect(offsets).toEqual(['0', '2', '4']);
    const first = new URL(fetchMock.mock.calls[0]?.[0] as string, 'http://localhost');
    expect(first.searchParams.get('search')).toBe('m');
  });
});

describe('useBulkDeleteMedia', () => {
  it('POSTs the ids to /media/bulk-delete', async () => {
    const client = createTestQueryClient();
    const { result, rendered } = renderHook(() => useBulkDeleteMedia(), withQueryClient(client));
    await rendered;
    let data: unknown;
    await act(async () => {
      data = await result.current.mutateAsync(['a', 'b']);
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/reverso/media/bulk-delete');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ ids: ['a', 'b'] });
    expect(data).toEqual({ deleted: 2, missing: [] });
  });
});
