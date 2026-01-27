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
  isLoading: boolean;
  error: string | null;
  canRegister: boolean; // Whether registration is open (no users exist yet)
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  checkSetupStatus: () => Promise<void>;
  clearError: () => void;
}

// Auth routes are at /auth/* (no /api/reverso prefix)
const API_BASE = '';

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      canRegister: true, // Default to true, will be checked on mount

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({
              isLoading: false,
              error: data.message || 'Login failed',
            });
            return false;
          }

          set({
            user: data.user,
            token: data.session?.token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            canRegister: false, // After login, registration is closed
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Network error',
          });
          return false;
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, name }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({
              isLoading: false,
              error: data.message || 'Registration failed',
            });
            return false;
          }

          set({
            user: data.user,
            token: data.session?.token || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            canRegister: false, // After registration, no more users can be created
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Network error',
          });
          return false;
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
          });
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
          const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include',
          });

          if (!response.ok) {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          const data = await response.json();
          set({
            user: data.user,
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
          const response = await fetch(`${API_BASE}/auth/setup-status`, {
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            set({ canRegister: data.canRegister ?? true });
          }
        } catch {
          // On error, assume registration is allowed (fail open)
          set({ canRegister: true });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'reverso-auth',
      partialize: (state) => ({
        token: state.token,
        // Don't persist canRegister as it's checked from server
        // Don't persist error as it's transient
      }),
    }
  )
);

// Selector hooks for convenience
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useCanRegister = () => useAuthStore((state) => state.canRegister);
