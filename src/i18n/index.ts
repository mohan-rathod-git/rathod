/**
 * i18n Configuration — Banjara Bandhan v4.0
 *
 * Supports: English, Hindi, Kannada, Telugu
 * Detection: browser language → localStorage → fallback to English
 * Lazy-loading: JSON bundles are imported dynamically
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locale bundles statically for reliability
// (they're small JSON files, total ~12KB across 4 languages)
import en from './locales/en.json';
import hi from './locales/hi.json';
import kn from './locales/kn.json';
import te from './locales/te.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      kn: { translation: kn },
      te: { translation: te },
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'bb_language',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Avoid flicker on initial render
    },
  });

export default i18n;
