import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import { supabase, signIn, signUp, signOut, getSession, signInWithOAuth } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  loginWithOAuth: (provider: 'google' | 'github') => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      initialize: async () => {
        try {
          set({ isLoading: true });

          // Get current session
          const { session, error } = await getSession();

          if (error) {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          if (session?.user) {
            set({
              user: session.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
          }

          // Listen for auth state changes
          supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              set({
                user: session.user,
                isAuthenticated: true,
              });
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                isAuthenticated: false,
              });
            }
          });
        } catch (error) {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await signIn(email, password);

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: 'Login failed' };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      register: async (email: string, password: string, fullName: string) => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await signUp(email, password, fullName);

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          if (data.user) {
            set({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: true }; // Email confirmation may be required
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Registration failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      logout: async () => {
        set({ isLoading: true });
        await signOut();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      loginWithOAuth: async (provider: 'google' | 'github') => {
        set({ isLoading: true, error: null });

        try {
          const { error } = await signInWithOAuth(provider);

          if (error) {
            set({ error: error.message, isLoading: false });
            return { success: false, error: error.message };
          }

          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'OAuth login failed';
          set({ error: message, isLoading: false });
          return { success: false, error: message };
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: !!user,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
