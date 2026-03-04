import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// API base URL - update this based on your backend deployment
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1' 
  : 'https://your-production-url.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear stored token
      await SecureStore.deleteItemAsync('auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;
