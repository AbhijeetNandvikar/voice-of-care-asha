import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { AuthResponse } from '../types';

// SecureStore keys
const TOKEN_KEY = 'auth_token';
const WORKER_KEY = 'worker_data';

// AsyncStorage key prefix for offline MPIN storage
const OFFLINE_MPIN_PREFIX = '@voiceofcare:offline_mpin_';

const isNetworkError = (error: any): boolean =>
  error.code === 'ECONNABORTED' ||
  error.message === 'Network Error' ||
  error.code === 'ERR_NETWORK' ||
  !error.response;

/**
 * Login with worker ID and password.
 * Requires active internet connection to authenticate with backend.
 */
export const login = async (
  workerId: string,
  password: string
): Promise<AuthResponse> => {
  console.log('[authService] Attempting login for worker:', workerId);
  
  try {
    console.log('[authService] Trying backend API...');
    const response = await api.post<AuthResponse>('/auth/login', {
      worker_id: workerId,
      password: password,
    });

    console.log('[authService] Backend login successful');
    const { access_token, worker } = response.data;
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(WORKER_KEY, JSON.stringify(worker));

    return response.data;
  } catch (error: any) {
    console.log('[authService] Backend login failed:', error.message);
    
    if (error.response?.status === 401) {
      throw new Error('Invalid worker ID or password');
    }
    if (error.response?.status === 403) {
      throw new Error('Account is not authorized');
    }

    if (isNetworkError(error)) {
      throw new Error('Network unavailable. Please check your internet connection and try again.');
    }

    throw new Error(error.response?.data?.detail || 'Login failed. Please try again.');
  }
};

/**
 * Setup MPIN for first-time login.
 * Falls back to local AsyncStorage storage when backend is unreachable.
 */
export const setupMPIN = async (mpin: string): Promise<void> => {
  if (!/^\d{4}$/.test(mpin)) {
    throw new Error('MPIN must be exactly 4 digits');
  }

  const token = await getStoredToken();
  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  // Try backend first
  try {
    await api.post('/auth/mpin/setup', { mpin });
    return;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response?.data?.detail || 'Invalid MPIN format');
    }

    // Network unavailable — store MPIN locally
    if (isNetworkError(error)) {
      const workerData = await getStoredWorker();
      if (!workerData?.worker_id) {
        throw new Error('Worker data not found. Please login again.');
      }
      await AsyncStorage.setItem(OFFLINE_MPIN_PREFIX + workerData.worker_id, mpin);
      return;
    }

    throw new Error(error.message || 'MPIN setup failed. Please try again.');
  }
};

/**
 * Verify MPIN for subsequent logins.
 * Falls back to locally stored MPIN when backend is unreachable.
 */
export const verifyMPIN = async (
  workerId: string,
  mpin: string
): Promise<AuthResponse> => {
  if (!/^\d{4}$/.test(mpin)) {
    throw new Error('MPIN must be exactly 4 digits');
  }

  // Try backend first
  try {
    const response = await api.post<AuthResponse>('/auth/mpin/verify', {
      worker_id: workerId,
      mpin: mpin,
    });

    const { access_token, worker } = response.data;
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(WORKER_KEY, JSON.stringify(worker));

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid MPIN');
    }
    if (error.response?.status === 404) {
      throw new Error('Worker not found');
    }

    // Network unavailable — check locally stored MPIN
    if (isNetworkError(error)) {
      const storedMpin = await AsyncStorage.getItem(OFFLINE_MPIN_PREFIX + workerId);
      if (storedMpin && storedMpin === mpin) {
        // Re-use the stored worker data
        const workerData = await getStoredWorker();
        if (!workerData) {
          throw new Error('Worker data not found. Please login with password.');
        }
        const mockToken = `mock_offline_${workerId}`;
        await SecureStore.setItemAsync(TOKEN_KEY, mockToken);
        return { access_token: mockToken, token_type: 'bearer', worker: workerData };
      }
      if (storedMpin) {
        throw new Error('Invalid MPIN');
      }
      throw new Error('Network unavailable and no offline MPIN found. Please login with password.');
    }

    throw new Error(error.response?.data?.detail || 'MPIN verification failed. Please try again.');
  }
};

/** Logout and clear stored credentials */
export const logout = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(WORKER_KEY);
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

/** Get stored JWT token */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/** Get stored worker data */
export const getStoredWorker = async (): Promise<any | null> => {
  try {
    const workerData = await SecureStore.getItemAsync(WORKER_KEY);
    return workerData ? JSON.parse(workerData) : null;
  } catch (error) {
    console.error('Error retrieving worker data:', error);
    return null;
  }
};

/** Check if user is authenticated */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getStoredToken();
  return token !== null;
};

/** Check if worker has MPIN setup */
export const hasMPINSetup = async (): Promise<boolean> => {
  try {
    const worker = await getStoredWorker();
    if (worker?.mpin_hash) return true;
    // Also check local offline MPIN
    if (worker?.worker_id) {
      const localMpin = await AsyncStorage.getItem(OFFLINE_MPIN_PREFIX + worker.worker_id);
      return localMpin !== null;
    }
    return false;
  } catch (error) {
    console.error('Error checking MPIN setup:', error);
    return false;
  }
};
