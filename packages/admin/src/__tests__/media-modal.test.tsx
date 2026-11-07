/**
 * MediaLibraryModal pages through the library with "Load more" and can select
 * items from any loaded page.
 */

import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaItem } from '../api/hooks/useMedia';
import { MediaLibraryModal } from '../components/media/MediaLibraryModal';
import { createTestQueryClient, render, waitFor, withQueryClient } from './render-helpers';

const TOTAL = 30;
const item = (i: number) => ({
  id: `m${i}`,
  url: `/uploads/m${i}.pdf`,
  filename: `file-${i}.pdf`,
  originalName: `file-${i}.pdf`,
  mimeType: 'application/pdf',
  size: 10,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(input, 'http://localhost');
      const limit = Number(url.searchParams.get('limit'));
      const offset = Number(url.searchParams.get('offset'));
      const all = Array.from({ length: TOTAL }, (_, i) => item(i));
      return new Response(
        JSON.stringify({
          success: true,
          data: all.slice(offset, offset + limit),
          meta: { total: TOTAL, limit, offset },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const names = () =>
  new Set(
    Array.from(document.querySelectorAll('p,span'))
      .map((n) => n.textContent ?? '')
      .filter((t) => /^file-\d+\.pdf$/.test(t))
  );
const button = (label: string) =>
  Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes(label));

describe('MediaLibraryModal', () => {
  it('loads more pages until the whole library is listed', async () => {
    const onSelect = vi.fn<(items: MediaItem[]) => void>();
    await render(
      withQueryClient(createTestQueryClient())(
        <MediaLibraryModal open onOpenChange={() => {}} onSelect={onSelect} />
      )
    );
    await waitFor(() => names().size > 0);
    expect(names().size).toBeLessThan(TOTAL);

    while (button('Load more')) {
      await act(async () => {
        button('Load more')?.click();
      });
      await waitFor(() => !button('Loading more'));
    }
    expect(names().size).toBe(TOTAL);
  });
});
