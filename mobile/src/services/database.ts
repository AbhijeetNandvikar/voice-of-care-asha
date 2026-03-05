import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for each "table"
export const KEYS = {
  WORKERS: '@voiceofcare:workers',
  BENEFICIARIES: '@voiceofcare:beneficiaries',
  TEMPLATES: '@voiceofcare:templates',
  VISITS: '@voiceofcare:visits',
  NEXT_VISIT_ID: '@voiceofcare:next_visit_id',
};

/**
 * Initialize storage with empty collections if they don't exist
 */
export const initializeDatabase = async (): Promise<void> => {
  const tableKeys = [KEYS.WORKERS, KEYS.BENEFICIARIES, KEYS.TEMPLATES, KEYS.VISITS];
  for (const key of tableKeys) {
    const existing = await AsyncStorage.getItem(key);
    if (existing === null) {
      await AsyncStorage.setItem(key, JSON.stringify([]));
    }
  }
  const nextId = await AsyncStorage.getItem(KEYS.NEXT_VISIT_ID);
  if (nextId === null) {
    await AsyncStorage.setItem(KEYS.NEXT_VISIT_ID, '1');
  }
  console.log('Database initialized successfully');
};

/**
 * Drop all data (for development/testing purposes)
 */
export const dropAllTables = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    KEYS.WORKERS,
    KEYS.BENEFICIARIES,
    KEYS.TEMPLATES,
    KEYS.VISITS,
    KEYS.NEXT_VISIT_ID,
  ]);
  console.log('All tables dropped successfully');
};

/**
 * Clear all data from storage (keeps keys with empty arrays)
 */
export const clearAllData = async (): Promise<void> => {
  const tableKeys = [KEYS.WORKERS, KEYS.BENEFICIARIES, KEYS.TEMPLATES, KEYS.VISITS];
  for (const key of tableKeys) {
    await AsyncStorage.setItem(key, JSON.stringify([]));
  }
  await AsyncStorage.setItem(KEYS.NEXT_VISIT_ID, '1');
  console.log('All data cleared successfully');
};

export default AsyncStorage;
