import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Worker } from '../types';

/**
 * App state interface
 */
interface AppState {
  // State
  currentUser: Worker | null;
  pendingSyncCount: number;
  isOnline: boolean;
  selectedLanguage: 'en' | 'hi';
  
  // Actions
  setCurrentUser: (user: Worker | null) => void;
  setPendingSyncCount: (count: number) => void;
  setIsOnline: (online: boolean) => void;
  setSelectedLanguage: (language: 'en' | 'hi') => void;
  clearState: () => void;
}

/**
 * Global app store using Zustand
 * 
 * Manages:
 * - Current authenticated user
 * - Pending sync count for offline visits
 * - Online/offline status
 * - Selected language (English/Hindi)
 * 
 * Persists user and language preferences to AsyncStorage
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      currentUser: null,
      pendingSyncCount: 0,
      isOnline: true,
      selectedLanguage: 'en',
      
      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
      
      setIsOnline: (online) => set({ isOnline: online }),
      
      setSelectedLanguage: (language) => set({ selectedLanguage: language }),
      
      clearState: () => set({
        currentUser: null,
        pendingSyncCount: 0,
        isOnline: true,
        selectedLanguage: 'en',
      }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user and language, not sync count or online status
      partialize: (state) => ({
        currentUser: state.currentUser,
        selectedLanguage: state.selectedLanguage,
      }),
    }
  )
);

/**
 * Selector hooks for optimized re-renders
 */
export const useCurrentUser = () => useAppStore((state) => state.currentUser);
export const usePendingSyncCount = () => useAppStore((state) => state.pendingSyncCount);
export const useIsOnline = () => useAppStore((state) => state.isOnline);
export const useSelectedLanguage = () => useAppStore((state) => state.selectedLanguage);
