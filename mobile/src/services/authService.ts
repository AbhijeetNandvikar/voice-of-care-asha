import * as SecureStore from 'expo-secure-store';
import api from './api';
import { AuthResponse } from '../types';

// SecureStore keys
const TOKEN_KEY = 'auth_token';
const WORKER_KEY = 'worker_data';

/**
 * Authentication Service
 * Handles worker authentication, MPIN setup/verification, and token management
 */

/**
 * Login with worker ID and password
 * @param workerId - 8-digit worker ID
 * @param password - Worker password
 * @returns AuthResponse with token and worker profile
 */
export const login = async (
  workerId: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/auth/login', {
      worker_id: workerId,
      password: password,
    });

    const { access_token, worker } = response.data;

    // Store token and worker data securely
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(WORKER_KEY, JSON.stringify(worker));

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid worker ID or password');
    } else if (error.response?.status === 403) {
      throw new Error('Account is not authorized');
    } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(error.response?.data?.detail || 'Login failed. Please try again.');
  }
};

/**
 * Setup MPIN for first-time login
 * @param mpin - 4-digit MPIN
 * @returns Success status
 */
export const setupMPIN = async (mpin: string): Promise<void> => {
  try {
    // Validate MPIN format
    if (!/^\d{4}$/.test(mpin)) {
      throw new Error('MPIN must be exactly 4 digits');
    }

    const token = await getStoredToken();
    if (!token) {
      throw new Error('Not authenticated. Please login first.');
    }

    await api.post('/auth/mpin/setup', { mpin });
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.detail || 'Invalid MPIN format');
    } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(error.message || 'MPIN setup failed. Please try again.');
  }
};

/**
 * Verify MPIN for subsequent logins
 * @param workerId - 8-digit worker ID
 * @param mpin - 4-digit MPIN
 * @returns AuthResponse with token and worker profile
 */
export const verifyMPIN = async (
  workerId: string,
  mpin: string
): Promise<AuthResponse> => {
  try {
    // Validate MPIN format
    if (!/^\d{4}$/.test(mpin)) {
      throw new Error('MPIN must be exactly 4 digits');
    }

    const response = await api.post<AuthResponse>('/auth/mpin/verify', {
      worker_id: workerId,
      mpin: mpin,
    });

    const { access_token, worker } = response.data;

    // Store token and worker data securely
    await SecureStore.setItemAsync(TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(WORKER_KEY, JSON.stringify(worker));

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Invalid MPIN');
    } else if (error.response?.status === 404) {
      throw new Error('Worker not found');
    } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(error.response?.data?.detail || 'MPIN verification failed. Please try again.');
  }
};

/**
 * Logout and clear stored credentials
 */
export const logout = async (): Promise<void> => {
  try {
    // Clear stored token and worker data
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(WORKER_KEY);
  } catch (error) {
    console.error('Error during logout:', error);
    // Even if deletion fails, we should allow logout
  }
};

/**
 * Get stored JWT token
 * @returns JWT token or null if not found
 */
export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

/**
 * Get stored worker data
 * @returns Worker object or null if not found
 */
export const getStoredWorker = async (): Promise<any | null> => {
  try {
    const workerData = await SecureStore.getItemAsync(WORKER_KEY);
    return workerData ? JSON.parse(workerData) : null;
  } catch (error) {
    console.error('Error retrieving worker data:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns true if token exists, false otherwise
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getStoredToken();
  return token !== null;
};

/**
 * Check if worker has MPIN setup
 * This should be called after successful login to determine if MPIN setup is needed
 * @returns true if MPIN is setup, false otherwise
 */
export const hasMPINSetup = async (): Promise<boolean> => {
  try {
    const worker = await getStoredWorker();
    // Check if worker has mpin_hash field (indicates MPIN is setup)
    return worker?.mpin_hash !== null && worker?.mpin_hash !== undefined;
  } catch (error) {
    console.error('Error checking MPIN setup:', error);
    return false;
  }
};
