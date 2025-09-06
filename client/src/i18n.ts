import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false, // Disable debug in production
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      requestOptions: {
        cache: 'no-cache' // Prevent caching issues during development
      }
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app-language', // Match what we use in I18nProvider
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    // Configure multiple namespaces
    defaultNS: 'common',
    ns: ['common', 'nav', 'dashboard', 'actions', 'landing', 'modal'],

    // Wait for resources to load
    initImmediate: false,
  });

export default i18n;