/**
 * Minimal react-dom harness shared by component tests (no testing-library in
 * this package). Not a test file itself: the name has no `.test` suffix.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface Rendered {
  container: HTMLDivElement;
  rerender: (ui: ReactNode) => Promise<void>;
  unmount: () => Promise<void>;
}

export async function render(ui: ReactNode): Promise<Rendered> {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  await act(async () => {
    root.render(ui);
  });
  return {
    container,
    rerender: (next) =>
      act(async () => {
        root.render(next);
      }),
    unmount: () =>
      act(async () => {
        root.unmount();
        container.remove();
      }),
  };
}

export function renderHook<R>(hook: () => R, wrapper?: (children: ReactNode) => ReactNode) {
  const result = { current: undefined as R };
  // biome-ignore lint/correctness/noComponentHookFactories: test harness; one component per rendered hook is the point
  function Harness() {
    result.current = hook();
    return null;
  }
  const ui = wrapper ? wrapper(<Harness />) : <Harness />;
  return { result, rendered: render(ui) };
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function withQueryClient(client: QueryClient) {
  return (children: ReactNode) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

/** Let pending promise continuations settle inside act. */
export const flush = () =>
  act(async () => {
    for (let i = 0; i < 10; i++) await Promise.resolve();
  });

/** Wait (inside act) until the predicate holds or the timeout elapses. */
export async function waitFor(predicate: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor timed out');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  }
}
