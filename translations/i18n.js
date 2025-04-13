import I18n from 'i18n-js';
import translations from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set translations
I18n.translations = translations;

// Set default locale to English
I18n.defaultLocale = 'en';
I18n.locale = 'en';

// Enable fallbacks to default locale
I18n.fallbacks = true;

// Map language codes from the app to i18n locale codes
export const LANGUAGE_TO_LOCALE = {
  english: 'en',
  hindi: 'hi',
  marathi: 'mr'
};

// Initialize i18n with saved language preference
export const initializeI18n = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('userLanguage');
    if (savedLanguage && LANGUAGE_TO_LOCALE[savedLanguage]) {
      I18n.locale = LANGUAGE_TO_LOCALE[savedLanguage];
    }
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

// Change the i18n locale
export const changeLocale = (language) => {
  if (LANGUAGE_TO_LOCALE[language]) {
    I18n.locale = LANGUAGE_TO_LOCALE[language];
  }
};

export default I18n; 