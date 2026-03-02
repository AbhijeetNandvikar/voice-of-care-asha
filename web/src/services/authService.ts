/**
 * Authentication Service
 * Handles login, logout, token management, and authentication state
 */

import axios from 'axios';

const API_BASE_URL = '/api/v1';
const TOKEN_KEY = 'auth_token';
const WORKER_KEY = 'worker_profile';

export interface WorkerProfile {
  id: number;
  first_name: string;
  last_name: string;
  worker_id: string;
  worker_type: string;
  phone_number: string;
  email?: string;
  address?: string;
  profile_photo_url?: string;
  collection_center_id?: number;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  worker: WorkerProfile;
}

export interface LoginCredentials {
  worker_id: string;
  password: string;
}

/**
 * Authenticate user with worker_id and password
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await axios.post<LoginResponse>(
      `${API_BASE_URL}/auth/login`,
      credentials
    );
    
    // Store token and worker profile in localStorage
    localStorage.setItem(TOKEN_KEY, response.data.access_token);
    localStorage.setItem(WORKER_KEY, JSON.stringify(response.data.worker));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.detail || 'Login failed');
    }
    throw new Error('Network error. Please try again.');
  }
}

/**
 * Logout user by clearing stored credentials
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(WORKER_KEY);
}

/**
 * Get stored JWT token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  // Check if token is expired by parsing JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < expirationTime;
  } catch {
    return false;
  }
}

/**
 * Get stored worker profile
 */
export function getWorkerProfile(): WorkerProfile | null {
  const workerData = localStorage.getItem(WORKER_KEY);
  if (!workerData) return null;
  
  try {
    return JSON.parse(workerData);
  } catch {
    return null;
  }
}

/**
 * Configure axios to include auth token in all requests
 */
export function setupAxiosInterceptors(): void {
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Handle 401 responses by logging out
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}
