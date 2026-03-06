import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { login as apiLogin, setupMPIN as apiSetupMPIN, verifyMPIN as apiVerifyMPIN } from '../services/authService';
import { Worker } from '../types';

interface AuthState {
  token: string | null;
  worker: Worker | null;
  isAuthenticated: boolean;
  hasMPIN: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAuth: (token: string, worker: Worker) => void;
  setMPINStatus: (hasMPIN: boolean) => void;
  login: (workerId: string, password: string) => Promise<void>;
  setupMPIN: (mpin: string) => Promise<void>;
  verifyMPIN: (mpin: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Custom storage for Zustand using SecureStore
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('Error reading from SecureStore:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error writing to SecureStore:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error removing from SecureStore:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      worker: null,
      isAuthenticated: false,
      hasMPIN: false,
      isLoading: false,
      error: null,

      setAuth: (token: string, worker: Worker) => {
        set({
          token,
          worker,
          isAuthenticated: true,
          hasMPIN: !!worker.mpin_hash,
          error: null,
        });
      },

      setMPINStatus: (hasMPIN: boolean) => {
        set({ hasMPIN });
      },

      login: async (workerId: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiLogin(workerId, password);
          // Also check locally stored offline MPIN so returning users go to MPINVerify
          const { hasMPINSetup } = await import('../services/authService');
          const hasMPIN = !!response.worker.mpin_hash || (await hasMPINSetup());
          set({
            token: response.access_token,
            worker: response.worker,
            isAuthenticated: true,
            hasMPIN,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Login failed',
          });
          throw error;
        }
      },

      setupMPIN: async (mpin: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiSetupMPIN(mpin);
          const worker = get().worker;
          if (worker) {
            set({
              worker: { ...worker, mpin_hash: 'set' },
              hasMPIN: true,
              isLoading: false,
              error: null,
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'MPIN setup failed',
          });
          throw error;
        }
      },

      verifyMPIN: async (mpin: string) => {
        set({ isLoading: true, error: null });
        try {
          const workerId = get().worker?.worker_id ?? '';
          const response = await apiVerifyMPIN(workerId, mpin);
          set({
            token: response.access_token,
            worker: response.worker,
            isAuthenticated: true,
            hasMPIN: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'MPIN verification failed',
          });
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          worker: null,
          isAuthenticated: false,
          hasMPIN: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
