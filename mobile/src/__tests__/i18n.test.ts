/**
 * i18n Configuration Tests
 * 
 * Tests to verify internationalization setup and functionality
 */

import i18n from '../i18n';
import { changeLanguage, getCurrentLanguage, hasTranslation } from '../utils/i18n';

describe('i18n Configuration', () => {
  beforeEach(() => {
    // Reset to English before each test
    i18n.changeLanguage('en');
  });

  test('should initialize with English as default language', () => {
    expect(i18n.language).toBe('en');
  });

  test('should have English and Hindi resources loaded', () => {
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('hi', 'translation')).toBe(true);
  });

  test('should translate basic keys in English', () => {
    expect(i18n.t('welcome')).toBe('Welcome to Voice of Care');
    expect(i18n.t('login')).toBe('Login');
    expect(i18n.t('dashboard')).toBe('Dashboard');
  });

  test('should translate basic keys in Hindi', () => {
    i18n.changeLanguage('hi');
    expect(i18n.t('welcome')).toBe('वॉयस ऑफ केयर में आपका स्वागत है');
    expect(i18n.t('login')).toBe('लॉगिन');
    expect(i18n.t('dashboard')).toBe('डैशबोर्ड');
  });

  test('should change language successfully', async () => {
    await changeLanguage('hi');
    expect(getCurrentLanguage()).toBe('hi');
    
    await changeLanguage('en');
    expect(getCurrentLanguage()).toBe('en');
  });

  test('should handle interpolation correctly', () => {
    const result = i18n.t('greeting', { name: 'Priya' });
    expect(result).toContain('Priya');
  });

  test('should fallback to English for missing translations', () => {
    i18n.changeLanguage('hi');
    const nonExistentKey = 'this_key_does_not_exist';
    const result = i18n.t(nonExistentKey);
    // Should return the key itself as fallback
    expect(result).toBe(nonExistentKey);
  });

  test('should check if translation exists', () => {
    expect(hasTranslation('welcome')).toBe(true);
    expect(hasTranslation('login')).toBe(true);
    expect(hasTranslation('nonexistent_key')).toBe(false);
  });
});

describe('Translation Keys Coverage', () => {
  const requiredKeys = [
    // Authentication
    'login',
    'logout',
    'worker_id',
    'password',
    'mpin',
    
    // Navigation
    'dashboard',
    'new_visit',
    'past_visits',
    'profile',
    
    // Common
    'loading',
    'error',
    'success',
    'retry',
    'cancel',
    'confirm',
    
    // Visit Flow
    'select_visit_type',
    'verify_beneficiary',
    'select_day',
    'data_collection',
    'visit_summary',
    
    // Status
    'completed',
    'pending',
    'synced',
    'not_synced',
  ];

  test('should have all required keys in English', () => {
    requiredKeys.forEach(key => {
      expect(i18n.exists(key, { lng: 'en' })).toBe(true);
    });
  });

  test('should have all required keys in Hindi', () => {
    requiredKeys.forEach(key => {
      expect(i18n.exists(key, { lng: 'hi' })).toBe(true);
    });
  });

  test('should have matching keys in both languages', () => {
    const enKeys = Object.keys(i18n.getResourceBundle('en', 'translation') || {});
    const hiKeys = Object.keys(i18n.getResourceBundle('hi', 'translation') || {});
    
    expect(enKeys.sort()).toEqual(hiKeys.sort());
  });
});

describe('Error Messages', () => {
  test('should have all error message translations', () => {
    const errorKeys = [
      'network_error',
      'server_error',
      'unknown_error',
      'login_failed',
      'invalid_credentials',
      'worker_id_required',
      'password_required',
      'mpin_required',
    ];

    errorKeys.forEach(key => {
      expect(i18n.exists(key, { lng: 'en' })).toBe(true);
      expect(i18n.exists(key, { lng: 'hi' })).toBe(true);
    });
  });
});

describe('Visit Type Translations', () => {
  test('should translate visit types correctly', () => {
    expect(i18n.t('hbnc')).toBe('HBNC');
    expect(i18n.t('hbnc_full')).toBe('Home-Based Newborn Care');
    
    i18n.changeLanguage('hi');
    expect(i18n.t('hbnc')).toBe('एचबीएनसी');
    expect(i18n.t('hbnc_full')).toBe('गृह-आधारित नवजात देखभाल');
  });
});

describe('Beneficiary Type Translations', () => {
  test('should translate beneficiary types correctly', () => {
    expect(i18n.t('individual')).toBe('Individual');
    expect(i18n.t('child')).toBe('Child');
    expect(i18n.t('mother_child')).toBe('Mother & Child');
    
    i18n.changeLanguage('hi');
    expect(i18n.t('individual')).toBe('व्यक्तिगत');
    expect(i18n.t('child')).toBe('बच्चा');
    expect(i18n.t('mother_child')).toBe('माँ और बच्चा');
  });
});
