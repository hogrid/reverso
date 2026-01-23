import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';

export interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: Theme;

  // Modal state
  activeModal: string | null;
  modalData: unknown;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  openModal: (name: string, data?: unknown) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      activeModal: null,
      modalData: null,

      // Actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        applyTheme(theme);
      },

      openModal: (name, data) => set({ activeModal: name, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: null }),
    }),
    {
      name: 'reverso-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

/**
 * Apply theme to document root
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }
}

/**
 * Initialize theme on app load
 */
export function initializeTheme() {
  const theme = useUIStore.getState().theme;
  applyTheme(theme);

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (useUIStore.getState().theme === 'system') {
      applyTheme('system');
    }
  });
}
