// Compatibility layer for existing components
// Re-exports I18n functionality with the old naming convention
export { I18nProvider as TranslationProvider } from './I18nProvider';
export { useTranslation } from './I18nProvider';

// Export additional items for backwards compatibility
export { useTranslation as useLanguage } from './I18nProvider';