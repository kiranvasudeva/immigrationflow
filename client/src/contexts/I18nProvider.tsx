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
  const { t: originalT, i18n } = useI18nextTranslation();

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'ro', name: 'Română' }
  ];

  // Enhanced translation function with automatic fallback
  const t = (key: string, options?: any): string => {
    try {
      // Handle namespace-based keys (namespace.key) 
      const parts = key.split('.');
      let namespace = 'common';
      let translationKey = key;
      
      if (parts.length > 1 && ['common', 'nav', 'actions', 'dashboard'].includes(parts[0])) {
        namespace = parts[0];
        translationKey = parts.slice(1).join('.');
      }
      
      const translation = originalT(translationKey, { 
        ...options, 
        lng: i18n.language, 
        ns: namespace 
      });
      
      // Ensure we always return a string
      const translationString = typeof translation === 'string' ? translation : String(translation);
      
      // Check if we got the key back (meaning no translation found)
      if (translationString === translationKey && i18n.language !== 'en') {
        // Try to get English fallback
        const fallback = originalT(translationKey, { 
          ...options, 
          lng: 'en', 
          ns: namespace 
        });
        const fallbackString = typeof fallback === 'string' ? fallback : String(fallback);
        if (fallbackString !== translationKey) {
          return fallbackString;
        }
      }
      
      return translationString;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      // Return a meaningful fallback instead of the key
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
  };

  const contextValue: I18nContextType = {
    t,
    language: i18n.language,
    changeLanguage: async (lng: string) => {
      await i18n.changeLanguage(lng);
      localStorage.setItem('app-language', lng);
    },
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
  
  // Add compatibility properties
  return {
    ...context,
    currentLanguage: context.language,
    setLanguage: context.changeLanguage
  };
}