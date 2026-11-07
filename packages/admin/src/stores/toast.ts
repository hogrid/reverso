/**
 * Tiny toast store: transient success/error notifications for mutations.
 * Rendered by <Toaster/> (components/common/Toaster.tsx).
 */

import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  show: (variant: ToastVariant, message: string, durationMs?: number) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  error: 8000,
};

/** Keep the stack short so a burst of failures can't cover the screen. */
const MAX_TOASTS = 5;

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (variant, message, durationMs) => {
    counter += 1;
    const id = `toast-${counter}`;
    set((state) => ({ toasts: [...state.toasts, { id, variant, message }].slice(-MAX_TOASTS) }));
    const duration = durationMs ?? DEFAULT_DURATION_MS[variant];
    if (duration > 0) {
      setTimeout(() => get().dismiss(id), duration);
    }
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string, durationMs?: number) =>
    useToastStore.getState().show('success', message, durationMs),
  error: (message: string, durationMs?: number) =>
    useToastStore.getState().show('error', message, durationMs),
  info: (message: string, durationMs?: number) =>
    useToastStore.getState().show('info', message, durationMs),
};

/**
 * Human-readable message for anything a mutation can reject with: an ApiError
 * from the client ({ error, message }), an Error, or something unknown.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object') {
    const { message, error: code } = error as { message?: unknown; error?: unknown };
    if (typeof message === 'string' && message.trim()) return message;
    if (typeof code === 'string' && code.trim()) return code;
  }
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export interface WithToastMessages<T> {
  /** Shown on success; omit for silent success. */
  success?: string | ((result: T) => string);
  /** Prefix for the failure toast, e.g. "Failed to publish form". */
  error?: string;
}

/**
 * Run a mutation and report the outcome as a toast. Resolves with the result,
 * or undefined when it failed (the error has already been shown).
 */
export async function withToast<T>(
  fn: () => Promise<T>,
  messages: WithToastMessages<T> = {}
): Promise<T | undefined> {
  try {
    const result = await fn();
    const success =
      typeof messages.success === 'function' ? messages.success(result) : messages.success;
    if (success) toast.success(success);
    return result;
  } catch (error) {
    const detail = errorMessage(error);
    toast.error(messages.error ? `${messages.error}: ${detail}` : detail);
    return undefined;
  }
}
