import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorScheme = 'light' | 'dark' | 'system';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  component: string;
  props?: Record<string, unknown>;
}

interface UIState {
  // Theme
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;

  // Sidebar (web/tablet)
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Toasts
  toasts: Toast[];
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
  hideToast: (id: string) => void;

  // Modals
  modals: Modal[];
  openModal: (component: string, props?: Record<string, unknown>) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Loading states
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // Onboarding
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
}

let toastIdCounter = 0;
let modalIdCounter = 0;

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      colorScheme: 'system',
      setColorScheme: (scheme) => set({ colorScheme: scheme }),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Toasts
      toasts: [],
      showToast: (type, message, duration = 5000) => {
        const id = `toast-${++toastIdCounter}`;
        const toast: Toast = { id, type, message, duration };

        set((state) => ({
          toasts: [...state.toasts, toast],
        }));

        // Auto-hide after duration
        if (duration > 0) {
          setTimeout(() => {
            get().hideToast(id);
          }, duration);
        }
      },
      hideToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Modals
      modals: [],
      openModal: (component, props) => {
        const id = `modal-${++modalIdCounter}`;
        set((state) => ({
          modals: [...state.modals, { id, component, props }],
        }));
        return id;
      },
      closeModal: (id) =>
        set((state) => ({
          modals: state.modals.filter((m) => m.id !== id),
        })),
      closeAllModals: () => set({ modals: [] }),

      // Loading
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Onboarding
      hasCompletedOnboarding: false,
      setHasCompletedOnboarding: (completed) =>
        set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        colorScheme: state.colorScheme,
        sidebarOpen: state.sidebarOpen,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
