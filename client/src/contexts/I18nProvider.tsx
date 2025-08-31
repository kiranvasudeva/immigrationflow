import React, { createContext, useContext, ReactNode } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import '../i18n';
import { clientLogger } from '../lib/clientLogger';
import { i18nDebugger } from '../lib/i18nDebugger';

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

  // Enhanced translation function with comprehensive logging
  const t = (key: string, options?: any): string => {
    clientLogger.debug('i18n', `Translation requested: ${key}`, { options, currentLanguage: i18n.language });
    
    try {
      // Handle namespace-based keys (namespace.key) 
      const parts = key.split('.');
      let namespace = 'translation';
      let translationKey = key;
      
      if (parts.length > 1 && ['common', 'nav', 'actions', 'dashboard', 'landing'].includes(parts[0])) {
        namespace = 'translation';
        translationKey = key; // Keep full key for namespace-less approach
      }
      
      const translation = originalT(translationKey, { 
        ...options, 
        lng: i18n.language, 
        ns: namespace 
      });
      
      // Ensure we always return a string
      const translationString = typeof translation === 'string' ? translation : String(translation);
      
      // Log the translation attempt
      i18nDebugger.logTranslationAttempt(key, translationString, options);
      
      // Check if we got the key back (meaning no translation found)
      if (translationString === translationKey && i18n.language !== 'en') {
        clientLogger.warn('i18n', `Translation not found, trying fallback: ${key}`);
        
        // Try to get English fallback
        const fallback = originalT(translationKey, { 
          ...options, 
          lng: 'en', 
          ns: namespace 
        });
        const fallbackString = typeof fallback === 'string' ? fallback : String(fallback);
        
        if (fallbackString !== translationKey) {
          clientLogger.info('i18n', `Fallback successful for key: ${key}`, { fallback: fallbackString });
          return fallbackString;
        }
      }
      
      return translationString;
    } catch (error) {
      const err = error as Error;
      clientLogger.error(`Translation error for key "${key}"`, { 
        key, 
        options, 
        error: err.message, 
        stack: err.stack 
      });
      
      // Return a meaningful fallback instead of the key
      const parts = key.split('.');
      return parts[parts.length - 1];
    }
  };

  const contextValue: I18nContextType = {
    t,
    language: i18n.language,
    changeLanguage: async (lng: string) => {
      clientLogger.userAction('Language change requested', { from: i18n.language, to: lng });
      await i18n.changeLanguage(lng);
      localStorage.setItem('app-language', lng);
      clientLogger.info('i18n', `Language changed successfully to: ${lng}`);
      
      // Run health check after language change
      setTimeout(() => i18nDebugger.checkTranslationHealth(), 500);
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