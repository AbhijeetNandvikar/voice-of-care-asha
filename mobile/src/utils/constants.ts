// Application constants

export const APP_NAME = 'Voice of Care (ASHA)';

// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api/v1' 
  : 'https://your-production-url.com/api/v1';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  WORKER_DATA: 'worker_data',
  LANGUAGE: 'app_language',
  LAST_SYNC: 'last_sync_time',
};

// Visit Types
export const VISIT_TYPES = {
  HBNC: 'hbnc',
  ANC: 'anc',
  PNC: 'pnc',
} as const;

// HBNC Day Numbers
export const HBNC_DAYS = [1, 3, 7, 14, 28] as const;

// Question Input Types
export const INPUT_TYPES = {
  YES_NO: 'yes_no',
  NUMBER: 'number',
  VOICE: 'voice',
} as const;

// Worker Types
export const WORKER_TYPES = {
  ASHA: 'asha_worker',
  MEDICAL_OFFICER: 'medical_officer',
  ANM: 'anm',
  AAW: 'aaw',
} as const;

// Beneficiary Types
export const BENEFICIARY_TYPES = {
  INDIVIDUAL: 'individual',
  CHILD: 'child',
  MOTHER_CHILD: 'mother_child',
} as const;

// Audio Configuration
export const AUDIO_CONFIG = {
  MAX_DURATION_MS: 60000, // 60 seconds
  FILE_EXTENSION: '.m4a',
  QUALITY: 'high',
} as const;

// Sync Configuration
export const SYNC_CONFIG = {
  TIMEOUT_MS: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
} as const;

// Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
} as const;
