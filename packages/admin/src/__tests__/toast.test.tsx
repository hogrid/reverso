/**
 * Toast store + <Toaster/>: mutation feedback shown to the user instead of
 * console.error.
 */

import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Toaster } from '../components/common/Toaster';
import { errorMessage, toast, useToastStore, withToast } from '../stores/toast';
import { render } from './render-helpers';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('toast store', () => {
  it('adds success and error toasts', () => {
    toast.success('Saved');
    toast.error('Boom');
    const toasts = useToastStore.getState().toasts;
    expect(toasts.map((t) => [t.variant, t.message])).toEqual([
      ['success', 'Saved'],
      ['error', 'Boom'],
    ]);
  });

  it('dismisses a toast by id', () => {
    const id = toast.success('Saved');
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('auto-dismisses after its duration', () => {
    vi.useFakeTimers();
    toast.success('Saved');
    vi.advanceTimersByTime(10_000);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});

describe('errorMessage', () => {
  it('prefers ApiError.message, then error, then Error.message, then fallback', () => {
    expect(errorMessage({ success: false, error: 'Bad Request', message: 'Slug taken' })).toBe(
      'Slug taken'
    );
    expect(errorMessage({ success: false, error: 'Bad Request' })).toBe('Bad Request');
    expect(errorMessage(new Error('network down'))).toBe('network down');
    expect(errorMessage(undefined, 'Could not save')).toBe('Could not save');
  });
});

describe('withToast', () => {
  it('toasts the success message and returns the result', async () => {
    const result = await withToast(async () => 42, { success: 'Form published' });
    expect(result).toBe(42);
    expect(useToastStore.getState().toasts).toMatchObject([
      { variant: 'success', message: 'Form published' },
    ]);
  });

  it('toasts the API error message with context and resolves undefined', async () => {
    const result = await withToast(
      async () => {
        throw { success: false, error: 'Bad Request', message: 'Slug already exists' };
      },
      { success: 'Saved', error: 'Failed to create form' }
    );
    expect(result).toBeUndefined();
    expect(useToastStore.getState().toasts).toMatchObject([
      { variant: 'error', message: 'Failed to create form: Slug already exists' },
    ]);
  });

  it('supports a success message computed from the result', async () => {
    await withToast(async () => ({ created: 3 }), {
      success: (r) => `Imported ${r.created} redirects`,
    });
    expect(useToastStore.getState().toasts[0]?.message).toBe('Imported 3 redirects');
  });
});

describe('<Toaster/>', () => {
  it('renders toasts in an aria-live status region and lets the user dismiss them', async () => {
    const { container } = await render(<Toaster />);
    const region = container.querySelector('[aria-live]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');

    await act(async () => {
      toast.error('Failed to publish form: nope');
    });
    const item = container.querySelector('[role="alert"]');
    expect(item?.textContent).toContain('Failed to publish form: nope');

    await act(async () => {
      toast.success('Form published');
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Form published');

    const close = container.querySelector<HTMLButtonElement>('button[aria-label="Dismiss notification"]');
    await act(async () => {
      close?.click();
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);
  });
});
