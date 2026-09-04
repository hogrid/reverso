/**
 * Authentication store using Zustand.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  image: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True while the initial session check (checkAuth) is running. */
  isLoading: boolean;
  /** True while a login or registration request is in flight. */
  isSubmitting: boolean;
  error: string | null;
  canRegister: boolean; // Whether registration is open (no users exist yet)
  /** True on a fresh install (no users yet); null until checked. */
  needsSetup: boolean | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;
  clearError: () => void;
  /** Drop the local session after the API rejected it (401). */
  sessionExpired: () => void;
}

// Auth routes are at /auth/* (no /api/reverso prefix)
const API_BASE = '';

// TD-012: guard every auth fetch with a timeout and tolerate non-JSON
// responses (e.g. an HTML 502/504 error page) so the store never crashes.
const AUTH_REQUEST_TIMEOUT_MS = 10_000;

interface AuthFetchResult {
  ok: boolean;
  status: number;
  // biome-ignore lint/suspicious/noExplicitAny: auth payloads are loosely typed
  data: any;
}

/**
 * Perform an auth fetch with a timeout and safe JSON parsing.
 * Always sends credentials so the httpOnly session cookie is included.
 * Throws on network failure or timeout (callers handle via try/catch).
 */
async function authFetch(path: string, options: RequestInit = {}): Promise<AuthFetchResult> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
    ...options,
  });

  // Tolerate empty or non-JSON bodies (HTML error pages, 204s, etc.).
  let data: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  return { ok: response.ok, status: response.status, data };
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      // Start as loading: ProtectedRoute must wait for the initial
      // checkAuth() before deciding to redirect, otherwise deep links
      // (e.g. /admin/pages/home) bounce to /login → / on every reload.
      isLoading: true,
      isSubmitting: false,
      error: null,
      canRegister: true, // Default to true, will be checked on mount
      needsSetup: null,

      login: async (email: string, password: string) => {
        set({ isSubmitting: true, error: null });

        try {
          const { ok, data } = await authFetch('/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!ok) {
            set({
              isSubmitting: false,
              error: data?.message || 'Login failed',
            });
            return false;
          }

          set({
            user: data?.user ?? null,
            token: data?.session?.token || null,
            isAuthenticated: true,
            isLoading: false,
            isSubmitting: false,
            error: null,
            canRegister: false, // After login, registration is closed
            needsSetup: false,
          });

          return true;
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Network error',
          });
          return false;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isSubmitting: true, error: null });

        try {
          const { ok, data } = await authFetch('/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, name }),
          });

          if (!ok) {
            set({
              isSubmitting: false,
              error: data?.message || 'Registration failed',
            });
            return false;
          }

          set({
            user: data?.user ?? null,
            token: data?.session?.token || null,
            isAuthenticated: true,
            isLoading: false,
            isSubmitting: false,
            error: null,
            canRegister: false, // After registration, no more users can be created
            needsSetup: false,
          });

          return true;
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Network error',
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await authFetch('/auth/logout', { method: 'POST' });
        } catch {
          // Ignore errors on logout
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });

        try {
          const { ok, data } = await authFetch('/auth/me');

          if (!ok) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          set({
            user: data?.user ?? null,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkSetupStatus: async () => {
        try {
          const { ok, data } = await authFetch('/auth/setup-status');

          if (ok) {
            set({
              canRegister: data?.canRegister ?? true,
              needsSetup: data?.needsSetup ?? null,
            });
          }
        } catch {
          // On error, assume registration is allowed (fail open)
          set({ canRegister: true });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      sessionExpired: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Your session has expired. Please sign in again.',
        });
      },
    }),
    {
      name: 'reverso-auth',
      // TD-011: never persist the session token in localStorage. The real
      // session lives in an httpOnly cookie ('reverso_session') sent with
      // credentials: 'include'. Persisting the token here was redundant and
      // widened the XSS surface, so nothing security-sensitive is persisted.
      // canRegister is re-checked from the server; error is transient.
      partialize: () => ({}),
    }
  )
);

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useCanRegister = () => useAuthStore((state) => state.canRegister);
