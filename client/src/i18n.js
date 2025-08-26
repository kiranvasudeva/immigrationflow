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

    ns: ['common', 'nav', 'actions'],
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

    // Custom missing key handler to ensure fallback works
    saveMissing: true,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      // In development, log missing keys
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation: ${lng}:${ns}:${key}`);
      }
      return fallbackValue || key;
    },

    // Ensure fallback language is used when key is missing
    fallbackOnNull: true,
    fallbackOnEmpty: true,
  });

// Save language changes to localStorage
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app-language', lng);
});

export default i18n;