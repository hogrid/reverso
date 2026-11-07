/**
 * Behavioural tests for the editor hooks: page switching (useEditorPage) and
 * the autosave lifecycle (useAutosave). Hooks are rendered with a minimal
 * react-dom harness; there is no testing-library in this package.
 */

import type { ContentValue } from '@reverso/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutosave } from '../hooks/useAutosave';
import { useEditorPage } from '../hooks/useEditorPage';
import { useEditorStore } from '../stores/editor';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderHook<P, R>(hook: (props: P) => R, initialProps: NoInfer<P>) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const result = { current: undefined as R };

  function Harness({ props }: { props: P }) {
    result.current = hook(props);
    return null;
  }

  const render = (props: P) =>
    act(async () => {
      root.render(<Harness props={props} />);
    });

  return {
    result,
    mount: () => render(initialProps),
    rerender: render,
    unmount: () =>
      act(async () => {
        root.unmount();
        container.remove();
      }),
  };
}

/** Run a store mutation inside act so React re-renders synchronously. */
const inStore = (fn: () => void) => act(async () => fn());

/** Let pending promise continuations (await onSave, finally) settle. */
const flushPromises = () =>
  act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
  });

const resetStore = () =>
  useEditorStore.setState({
    currentPage: null,
    dirtyFields: new Map(),
    history: [],
    historyIndex: -1,
    autosaveEnabled: true,
    lastSaved: null,
    isSaving: false,
    focusedField: null,
    validationErrors: new Map(),
  });

const dirty = () => useEditorStore.getState().getDirtyFieldsData();
const setField = (path: string, value: ContentValue) =>
  inStore(() => useEditorStore.getState().setFieldValue(path, value, 'original'));

describe('useEditorPage', () => {
  beforeEach(resetStore);

  it('switches the store to the slug on mount and discards the previous page state on slug change', async () => {
    const page = renderHook((slug: string) => useEditorPage(slug), 'home');
    await page.mount();
    expect(useEditorStore.getState().currentPage).toBe('home');

    await setField('home.hero.title', 'edited on home');
    expect(dirty()).toEqual({ 'home.hero.title': 'edited on home' });

    await page.rerender('about');
    expect(useEditorStore.getState().currentPage).toBe('about');
    expect(dirty()).toEqual({});
    expect(useEditorStore.getState().history).toEqual([]);

    await page.unmount();
  });

  it('discards dirty fields when the editor unmounts (leave without saving)', async () => {
    const page = renderHook((slug: string) => useEditorPage(slug), 'home');
    await page.mount();
    await setField('home.hero.title', 'never saved');

    await page.unmount();
    expect(useEditorStore.getState().currentPage).toBeNull();
    expect(dirty()).toEqual({});
  });

  it('clears a stuck saving flag when a page is opened', async () => {
    useEditorStore.setState({ isSaving: true, lastSaved: new Date() });
    const page = renderHook((slug: string) => useEditorPage(slug), 'home');
    await page.mount();

    expect(useEditorStore.getState().isSaving).toBe(false);
    expect(useEditorStore.getState().lastSaved).toBeNull();
    await page.unmount();
  });
});

describe('useAutosave', () => {
  const DEBOUNCE = 3000;

  beforeEach(() => {
    resetStore();
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderAutosave = (onSave: (data: Record<string, ContentValue>) => Promise<void>, onError = vi.fn()) =>
    renderHook(() => useAutosave({ onSave, onError, debounceMs: DEBOUNCE }), undefined);

  const tick = (ms = DEBOUNCE) =>
    act(async () => {
      vi.advanceTimersByTime(ms);
    });

  it('resets isSaving when the save settles after the editor unmounted', async () => {
    const pending = deferred();
    const onSave = vi.fn(() => pending.promise);
    const hook = renderAutosave(onSave);
    await hook.mount();

    await setField('home.hero.title', 'v1');
    await tick();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(useEditorStore.getState().isSaving).toBe(true);

    // User leaves while the PATCH is still in flight.
    await hook.unmount();
    expect(useEditorStore.getState().isSaving).toBe(true);

    pending.resolve();
    await flushPromises();
    expect(useEditorStore.getState().isSaving).toBe(false);
  });

  it('resets isSaving when a save fails after the editor unmounted', async () => {
    const pending = deferred();
    const onSave = vi.fn(() => pending.promise);
    const hook = renderAutosave(onSave);
    await hook.mount();

    await setField('home.hero.title', 'v1');
    await tick();
    await hook.unmount();

    pending.reject(new Error('network down'));
    await flushPromises();
    expect(useEditorStore.getState().isSaving).toBe(false);
  });

  it('does not retry automatically after a failed save until the user edits again', async () => {
    const onSave = vi.fn(() => Promise.reject(new Error('500')));
    const onError = vi.fn();
    const hook = renderAutosave(onSave, onError);
    await hook.mount();

    await setField('home.hero.title', 'v1');
    await tick();
    await flushPromises();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(useEditorStore.getState().isSaving).toBe(false);
    // The failed data stays dirty so the user can retry.
    expect(dirty()).toEqual({ 'home.hero.title': 'v1' });

    // No automatic retries while nothing changed.
    await tick();
    await flushPromises();
    await tick();
    await flushPromises();
    expect(onSave).toHaveBeenCalledTimes(1);

    // A new edit re-arms autosave.
    await setField('home.hero.title', 'v2');
    await tick();
    await flushPromises();
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ 'home.hero.title': 'v2' });

    await hook.unmount();
  });

  it('still allows a manual save after a failure', async () => {
    const onSave = vi.fn(() => Promise.reject(new Error('500')));
    const hook = renderAutosave(onSave);
    await hook.mount();

    await setField('home.hero.title', 'v1');
    await tick();
    await flushPromises();
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      await hook.result.current.save();
    });
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(useEditorStore.getState().isSaving).toBe(false);

    await hook.unmount();
  });

  it('keeps edits typed during an in-flight save dirty and saves them next', async () => {
    const pending = deferred();
    const onSave = vi.fn((_data: Record<string, ContentValue>) => pending.promise);
    const hook = renderAutosave(onSave);
    await hook.mount();

    await setField('home.hero.title', 'v1');
    await setField('home.hero.subtitle', 'sub');
    await tick();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenLastCalledWith({
      'home.hero.title': 'v1',
      'home.hero.subtitle': 'sub',
    });

    // Typing continues while the PATCH is in flight.
    await setField('home.hero.title', 'v2');
    await setField('home.cta.label', 'Go');

    pending.resolve();
    await flushPromises();

    expect(useEditorStore.getState().isSaving).toBe(false);
    expect(useEditorStore.getState().lastSaved).toBeInstanceOf(Date);
    expect(dirty()).toEqual({ 'home.hero.title': 'v2', 'home.cta.label': 'Go' });

    // The next autosave picks up exactly the newer edits.
    onSave.mockImplementation(() => Promise.resolve());
    await tick();
    await flushPromises();
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith({ 'home.hero.title': 'v2', 'home.cta.label': 'Go' });
    expect(dirty()).toEqual({});

    await hook.unmount();
  });

  it('does not touch the next page when a previous page save settles after navigation', async () => {
    const pending = deferred();
    const onSave = vi.fn(() => pending.promise);
    const hook = renderAutosave(onSave);
    await hook.mount();

    await inStore(() => useEditorStore.getState().setCurrentPage('home'));
    await setField('home.hero.title', 'v1');
    await tick();
    expect(onSave).toHaveBeenCalledTimes(1);

    // User leaves page A without waiting and opens page B.
    await hook.unmount();
    await inStore(() => useEditorStore.getState().setCurrentPage('about'));
    await setField('about.hero.title', 'typed on B');

    pending.resolve();
    await flushPromises();

    expect(useEditorStore.getState().isSaving).toBe(false);
    expect(useEditorStore.getState().lastSaved).toBeNull();
    expect(dirty()).toEqual({ 'about.hero.title': 'typed on B' });
  });

  it('releases the saving flag only for the request that owns it', async () => {
    const pendingA = deferred();
    const onSaveA = vi.fn(() => pendingA.promise);
    const hookA = renderAutosave(onSaveA);
    await hookA.mount();
    await inStore(() => useEditorStore.getState().setCurrentPage('home'));
    await setField('home.hero.title', 'v1');
    await tick();
    expect(onSaveA).toHaveBeenCalledTimes(1);

    // Leave A while its save is pending, open B and start saving B.
    await hookA.unmount();
    await inStore(() => useEditorStore.getState().setCurrentPage('about'));
    const pendingB = deferred();
    const onSaveB = vi.fn(() => pendingB.promise);
    const hookB = renderAutosave(onSaveB);
    await hookB.mount();
    await setField('about.hero.title', 'b1');
    await tick();
    expect(onSaveB).toHaveBeenCalledTimes(1);
    expect(useEditorStore.getState().isSaving).toBe(true);

    // A settles first: B's request is still in flight, so the flag stays.
    pendingA.resolve();
    await flushPromises();
    expect(useEditorStore.getState().isSaving).toBe(true);

    // A second B save must not start while the first is running.
    await act(async () => {
      await hookB.result.current.save();
    });
    expect(onSaveB).toHaveBeenCalledTimes(1);

    pendingB.resolve();
    await flushPromises();
    expect(useEditorStore.getState().isSaving).toBe(false);
    expect(dirty()).toEqual({});
    await hookB.unmount();
  });

  it('does not call onSave when there is nothing dirty', async () => {
    const onSave = vi.fn(() => Promise.resolve());
    const hook = renderAutosave(onSave);
    await hook.mount();

    await act(async () => {
      await hook.result.current.save();
    });
    await tick();
    expect(onSave).not.toHaveBeenCalled();

    await hook.unmount();
  });
});
