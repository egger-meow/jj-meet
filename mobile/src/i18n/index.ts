// i18n entry point
import zhTW from './zh-TW';
import en from './en';
import * as SecureStore from 'expo-secure-store';

// Available languages
export const languages = {
  'zh-TW': { name: '繁體中文', nativeName: '繁體中文' },
  'en': { name: 'English', nativeName: 'English' },
} as const;

export type LanguageCode = keyof typeof languages;

// All translations
export const translations: Record<LanguageCode, typeof zhTW> = {
  'zh-TW': zhTW,
  'en': en,
};

// Language storage key
const LANGUAGE_KEY = 'app_language';

// Current language state (default to Traditional Chinese for Taiwan market)
let currentLanguage: LanguageCode = 'zh-TW';

// Get current translations
export const getTranslations = () => translations[currentLanguage];

// Initialize language from storage
export const initLanguage = async (): Promise<LanguageCode> => {
  try {
    const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (stored && stored in languages) {
      currentLanguage = stored as LanguageCode;
    }
  } catch (error) {
    console.warn('[i18n] Failed to load language preference:', error);
  }
  return currentLanguage;
};

// Set language and persist
export const setLanguage = async (lang: LanguageCode): Promise<void> => {
  currentLanguage = lang;
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  } catch (error) {
    console.warn('[i18n] Failed to save language preference:', error);
  }
};

// Get current language code
export const getCurrentLanguage = (): LanguageCode => currentLanguage;

// Default export - current translations (for backward compatibility)
export const t = translations['zh-TW'];

export default t;
