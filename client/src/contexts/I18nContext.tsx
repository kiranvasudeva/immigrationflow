import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import '../i18n';

interface I18nContextType {
  t: (key: string, options?: any) => string;
  language: string;
  changeLanguage: (lng: string) => Promise<void>;
  availableLanguages: { code: string; name: string }[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const { t, i18n } = useI18nextTranslation();

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' }
  ];

  const contextValue: I18nContextType = {
    t: (key: string, options?: any) => {
      const translation = t(key, options);
      // Fallback to English if translation key is returned
      if (translation === key && i18n.language !== 'en') {
        return t(key, { ...options, lng: 'en' });
      }
      return translation;
    },
    language: i18n.language,
    changeLanguage: i18n.changeLanguage,
    availableLanguages,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  
  // Add compatibility with the old API
  return {
    ...context,
    currentLanguage: context.language,
    setLanguage: context.changeLanguage
  };
}