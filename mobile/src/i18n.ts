import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import hi from './locales/hi.json';

const LANGUAGE_KEY = 'app_language';

// Load saved language preference
const loadLanguagePreference = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    console.error('Failed to load language preference:', error);
    return 'en';
  }
};

// Initialize i18n
const initI18n = async () => {
  const savedLanguage = await loadLanguagePreference();
  
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        hi: { translation: hi },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

// Initialize on module load
initI18n();

export default i18n;
