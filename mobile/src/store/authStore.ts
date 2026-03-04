import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Worker } from '../types';

interface AuthState {
  token: string | null;
  worker: Worker | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, worker: Worker) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  worker: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (token: string, worker: Worker) => {
    await SecureStore.setItemAsync('auth_token', token);
    await SecureStore.setItemAsync('worker_data', JSON.stringify(worker));
    set({ token, worker, isAuthenticated: true });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('worker_data');
    set({ token: null, worker: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const workerData = await SecureStore.getItemAsync('worker_data');
      
      if (token && workerData) {
        const worker = JSON.parse(workerData);
        set({ token, worker, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ isLoading: false });
    }
  },
}));
