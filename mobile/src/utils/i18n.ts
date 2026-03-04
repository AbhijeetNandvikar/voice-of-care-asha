import i18n from '../i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_KEY = 'app_language';

/**
 * Change the app language
 * @param language - 'en' or 'hi'
 */
export const changeLanguage = async (language: 'en' | 'hi'): Promise<void> => {
  try {
    await i18n.changeLanguage(language);
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

/**
 * Get the current language
 * @returns Current language code ('en' or 'hi')
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

/**
 * Get saved language preference from storage
 * @returns Saved language code or 'en' as default
 */
export const getSavedLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    console.error('Failed to get saved language:', error);
    return 'en';
  }
};

/**
 * Translate a key
 * @param key - Translation key
 * @param options - Interpolation options
 * @returns Translated string
 */
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

/**
 * Check if a translation key exists
 * @param key - Translation key
 * @returns True if key exists
 */
export const hasTranslation = (key: string): boolean => {
  return i18n.exists(key);
};
