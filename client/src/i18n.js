import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: localStorage.getItem('app-language') || 'en',
    fallbackLng: 'en',
    debug: false,

    ns: ['common', 'nav', 'actions', 'dashboard'],
    defaultNS: 'common',

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    // Enhanced fallback configuration
    fallbackOnNull: true,
    fallbackOnEmpty: true,
    returnNull: false,
    returnEmptyString: false,
    
    // Custom missing key handler
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      // In development, log missing keys but don't show them to users
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${lng}:${ns}:${key}`);
      }
      
      // Always return fallback value or the key as last resort
      return fallbackValue || key;
    },

    // Load all namespaces at startup to avoid loading issues
    preload: ['en', 'ro'],
    load: 'languageOnly',
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app-language', lng);
});

export default i18n;