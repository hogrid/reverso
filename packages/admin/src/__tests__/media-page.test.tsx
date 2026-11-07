/**
 * MediaPage: "Load more" pagination, a search box that survives refetches,
 * and toast feedback for bulk delete.
 */

import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaPage } from '../pages/MediaPage';
import { useToastStore } from '../stores/toast';
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

let fetchMock: ReturnType<typeof vi.fn>;
let bulkDeleteStatus = 200;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

beforeEach(() => {
  bulkDeleteStatus = 200;
  useToastStore.setState({ toasts: [] });
  fetchMock = vi.fn(async (input: string) => {
    const url = new URL(input, 'http://localhost');
    if (url.pathname.endsWith('/media/bulk-delete')) {
      return bulkDeleteStatus === 200
        ? json({ success: true, data: { deleted: 2, missing: [] } })
        : json({ success: false, error: 'Forbidden', message: 'Admins only' }, bulkDeleteStatus);
    }
    const limit = Number(url.searchParams.get('limit'));
    const offset = Number(url.searchParams.get('offset'));
    const search = url.searchParams.get('search') ?? '';
    const all = Array.from({ length: TOTAL }, (_, i) => item(i)).filter((m) =>
      m.filename.includes(search)
    );
    return json({
      success: true,
      data: all.slice(offset, offset + limit),
      meta: { total: all.length, limit, offset },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

const listedNames = () =>
  Array.from(document.querySelectorAll('p,span'))
    .map((n) => n.textContent ?? '')
    .filter((t) => /^file-\d+\.pdf$/.test(t));

async function setup() {
  const client = createTestQueryClient();
  const view = await render(withQueryClient(client)(<MediaPage />));
  await waitFor(() => listedNames().length > 0);
  return view;
}

function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

const findButton = (label: string) =>
  Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes(label));

describe('MediaPage pagination', () => {
  it('loads further pages with "Load more" until the total is reached', async () => {
    await setup();
    const firstCount = new Set(listedNames()).size;
    expect(firstCount).toBeLessThan(TOTAL);
    expect(document.body.textContent).toContain(`of ${TOTAL}`);

    while (findButton('Load more')) {
      await act(async () => {
        findButton('Load more')?.click();
      });
      await waitFor(() => !findButton('Loading more'));
    }
    expect(new Set(listedNames()).size).toBe(TOTAL);
  });
});

describe('MediaPage search', () => {
  it('keeps the search input mounted and focused while results refetch', async () => {
    await setup();
    const input = document.querySelector<HTMLInputElement>('input[type="search"]');
    expect(input).not.toBeNull();
    input?.focus();
    await act(async () => {
      typeInto(input as HTMLInputElement, 'file-1');
    });
    // Same element, still focused, even mid-refetch.
    expect(document.querySelector('input[type="search"]')).toBe(input);
    expect(document.activeElement).toBe(input);
    await waitFor(() => listedNames().every((n) => n.includes('file-1')));
    expect(document.querySelector('input[type="search"]')).toBe(input);
    expect(document.activeElement).toBe(input);
  });
});

describe('MediaPage bulk delete', () => {
  async function selectTwoAndDelete() {
    await setup();
    const boxes = Array.from(document.querySelectorAll<HTMLButtonElement>('button[role="checkbox"]'));
    // boxes[0] is "Select all"; pick two item checkboxes.
    await act(async () => {
      boxes[1]?.click();
    });
    await act(async () => {
      boxes[2]?.click();
    });
    await act(async () => {
      findButton('Delete')?.click();
    });
    const confirm = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
      (b) => b.textContent === 'Delete'
    ) as HTMLButtonElement | undefined;
    await act(async () => {
      confirm?.click();
    });
  }

  it('calls the bulk-delete endpoint and toasts success', async () => {
    await selectTwoAndDelete();
    await waitFor(() => useToastStore.getState().toasts.length > 0);
    const call = fetchMock.mock.calls.find(([u]) => String(u).endsWith('/media/bulk-delete'));
    expect(call).toBeDefined();
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'success' });
  });

  it('shows the API error message when bulk delete fails', async () => {
    bulkDeleteStatus = 403;
    await selectTwoAndDelete();
    await waitFor(() => useToastStore.getState().toasts.length > 0);
    expect(useToastStore.getState().toasts[0]).toMatchObject({ variant: 'error' });
    expect(useToastStore.getState().toasts[0]?.message).toContain('Admins only');
  });
});
