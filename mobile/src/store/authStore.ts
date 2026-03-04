import { create } from 'zustand';
import { Worker } from '../types';
import * as authService from '../services/authService';

interface AuthState {
  worker: Worker | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (workerId: string, password: string) => Promise<void>;
  verifyMPIN: (workerId: string, mpin: string) => Promise<void>;
  setupMPIN: (mpin: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setWorker: (worker: Worker | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  worker: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (workerId: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(workerId, password);
      set({ 
        worker: response.worker, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message, 
        isLoading: false, 
        isAuthenticated: false 
      });
      throw error;
    }
  },

  verifyMPIN: async (workerId: string, mpin: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.verifyMPIN(workerId, mpin);
      set({ 
        worker: response.worker, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message, 
        isLoading: false, 
        isAuthenticated: false 
      });
      throw error;
    }
  },

  setupMPIN: async (mpin: string) => {
    set({ isLoading: true, error: null });
    try {
      await authService.setupMPIN(mpin);
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authService.logout();
      set({ 
        worker: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const worker = await authService.getStoredWorker();
        set({ 
          worker, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } else {
        set({ 
          worker: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    } catch (error) {
      set({ 
        worker: null, 
        isAuthenticated: false, 
        isLoading: false 
      });
    }
  },

  // Alias for backward compatibility
  loadAuth: async () => {
    await useAuthStore.getState().checkAuth();
  },

  clearError: () => set({ error: null }),
  
  setWorker: (worker: Worker | null) => set({ worker }),
}));
