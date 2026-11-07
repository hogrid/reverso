/**
 * Submissions CSV export: POST the export route (there is no GET) and hand the
 * CSV to the browser as a Blob download.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportFormSubmissions } from '../api/hooks/useForms';
import { saveBlob } from '../lib/utils';

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(
    async () =>
      new Response('ID,Status\n1,new', {
        status: 200,
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename="contact-submissions.csv"',
        },
      })
  );
  vi.stubGlobal('fetch', fetchMock);
  URL.createObjectURL = vi.fn(() => 'blob:mock');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('saveBlob', () => {
  it('clicks a temporary anchor pointing at an object URL with the filename', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.useFakeTimers();
    saveBlob(new Blob(['x']), 'a.csv');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalledTimes(1);
    const anchor = click.mock.contexts[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('a.csv');
    expect(anchor.href).toBe('blob:mock');
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});

describe('exportFormSubmissions', () => {
  it('POSTs the export endpoint and downloads the CSV', async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await exportFormSubmissions('form-1', 'contact');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/reverso/forms/form-1/submissions/export');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('include');
    expect(click).toHaveBeenCalledTimes(1);
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('contact-submissions.csv');
  });
});
