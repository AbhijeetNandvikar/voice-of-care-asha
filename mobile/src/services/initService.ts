import api from './api';
import databaseService from './databaseService';
import { InitData } from '../types';

/**
 * Initialization Service
 * Handles first-login data initialization from backend
 */

/**
 * Fetch initialization data from backend
 * Calls GET /api/v1/mobile/init to retrieve worker profile, assigned beneficiaries, and templates
 * @returns InitData containing worker, beneficiaries, and templates
 * @throws Error if network request fails or data is invalid
 */
export const fetchInitData = async (): Promise<InitData> => {
  try {
    const response = await api.get<InitData>('/mobile/init');
    
    // Validate response data
    if (!response.data || !response.data.worker) {
      throw new Error('Invalid initialization data received from server');
    }

    if (!Array.isArray(response.data.beneficiaries)) {
      throw new Error('Invalid beneficiaries data received from server');
    }

    if (!Array.isArray(response.data.templates)) {
      throw new Error('Invalid templates data received from server');
    }

    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Session expired. Please login again.');
    } else if (error.response?.status === 404) {
      throw new Error('Worker data not found. Please contact administrator.');
    } else if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    throw new Error(error.message || 'Failed to fetch initialization data. Please try again.');
  }
};

/**
 * Seed local SQLite database with initialization data
 * Populates workers, beneficiaries, and templates tables
 * @param data - InitData from backend
 * @throws Error if database seeding fails
 */
export const seedDatabase = async (data: InitData): Promise<void> => {
  try {
    // Validate data before seeding
    if (!data.worker || !data.worker.id) {
      throw new Error('Invalid worker data');
    }

    if (!Array.isArray(data.beneficiaries)) {
      throw new Error('Invalid beneficiaries data');
    }

    if (!Array.isArray(data.templates)) {
      throw new Error('Invalid templates data');
    }

    // Seed database using database service
    await databaseService.seedFromServer(data);
    
    console.log('Database seeded successfully with:', {
      worker: `${data.worker.first_name} ${data.worker.last_name}`,
      beneficiariesCount: data.beneficiaries.length,
      templatesCount: data.templates.length,
    });
  } catch (error: any) {
    console.error('Error seeding database:', error);
    throw new Error(error.message || 'Failed to initialize local database. Please try again.');
  }
};

/**
 * Complete initialization flow
 * Fetches data from backend and seeds local database
 * @returns InitData that was fetched and seeded
 * @throws Error if any step fails
 */
export const initializeApp = async (): Promise<InitData> => {
  try {
    // Step 1: Fetch initialization data from backend
    const initData = await fetchInitData();
    
    // Step 2: Seed local database
    await seedDatabase(initData);
    
    return initData;
  } catch (error: any) {
    console.error('Initialization failed:', error);
    throw error;
  }
};

export default {
  fetchInitData,
  seedDatabase,
  initializeApp,
};
