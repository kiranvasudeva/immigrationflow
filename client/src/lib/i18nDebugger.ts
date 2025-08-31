/**
 * I18N DEBUGGING SYSTEM
 * Comprehensive logging for translation system behavior
 */

import { clientLogger } from './clientLogger';
import i18n from '../i18n';

class I18nDebugger {
  private translationAttempts = new Map<string, number>();
  private failedKeys = new Set<string>();
  private loadedNamespaces = new Set<string>();

  constructor() {
    this.setupI18nEventListeners();
    this.logInitialState();
  }

  private setupI18nEventListeners() {
    // Listen to i18next events
    i18n.on('initialized', (options) => {
      clientLogger.i18n('I18next initialized', {
        language: i18n.language,
        languages: i18n.languages,
        options: {
          fallbackLng: options.fallbackLng,
          debug: options.debug,
          backend: options.backend
        }
      });
    });

    i18n.on('loaded', (loaded) => {
      clientLogger.i18n('I18next resources loaded', { loaded });
      Object.keys(loaded).forEach(lng => {
        Object.keys(loaded[lng]).forEach(ns => {
          this.loadedNamespaces.add(`${lng}:${ns}`);
        });
      });
    });

    i18n.on('failedLoading', (lng, ns, msg) => {
      clientLogger.warn('i18n', 'Failed to load translation resource', {
        language: lng,
        namespace: ns,
        message: msg
      });
    });

    i18n.on('missingKey', (lngs, namespace, key, res) => {
      this.failedKeys.add(key);
      clientLogger.warn('i18n', 'Missing translation key', {
        languages: lngs,
        namespace,
        key,
        result: res
      });
    });

    i18n.on('languageChanged', (lng) => {
      clientLogger.i18n('Language changed', {
        newLanguage: lng,
        previousLanguage: i18n.languages[1] || 'unknown'
      });
    });
  }

  private logInitialState() {
    clientLogger.i18n('I18n debugger initialized', {
      isInitialized: i18n.isInitialized,
      language: i18n.language,
      languages: i18n.languages,
      hasResourceBundle: i18n.hasResourceBundle('en', 'translation'),
      store: i18n.store?.data
    });
  }

  // Track translation attempts
  logTranslationAttempt(key: string, result: string, options?: any) {
    const attempts = this.translationAttempts.get(key) || 0;
    this.translationAttempts.set(key, attempts + 1);

    const isKeyReturned = result === key;
    const isSuccessful = !isKeyReturned;

    clientLogger.debug('i18n', `Translation attempt: ${key}`, {
      key,
      result,
      isSuccessful,
      isKeyReturned,
      attempts: attempts + 1,
      options,
      currentLanguage: i18n.language,
      hasResourceBundle: i18n.hasResourceBundle(i18n.language, 'translation')
    });

    if (isKeyReturned && attempts === 0) {
      // First time this key failed
      clientLogger.warn('i18n', `Translation key not found: ${key}`, {
        key,
        currentLanguage: i18n.language,
        availableLanguages: i18n.languages,
        loadedNamespaces: Array.from(this.loadedNamespaces),
        resourceBundle: i18n.getResourceBundle(i18n.language, 'translation')
      });
    }
  }

  // Check translation loading status
  async checkTranslationHealth() {
    clientLogger.i18n('Translation health check', {
      isInitialized: i18n.isInitialized,
      currentLanguage: i18n.language,
      availableLanguages: i18n.languages,
      loadedNamespaces: Array.from(this.loadedNamespaces),
      failedKeysCount: this.failedKeys.size,
      failedKeys: Array.from(this.failedKeys).slice(0, 10), // First 10 failed keys
      totalTranslationAttempts: this.translationAttempts.size,
      resourceBundles: {
        en: i18n.getResourceBundle('en', 'translation'),
        ro: i18n.getResourceBundle('ro', 'translation')
      }
    });

    // Test loading specific translation files
    try {
      const enResponse = await fetch('/locales/en/translation.json');
      const enData = await enResponse.json();
      clientLogger.i18n('English translation file loaded successfully', {
        status: enResponse.status,
        keysCount: Object.keys(enData).length,
        hasLandingKeys: !!enData.landing,
        landingKeysCount: enData.landing ? Object.keys(enData.landing).length : 0
      });
    } catch (error) {
      const err = error as Error;
      clientLogger.error('Failed to load English translation file', {
        error: err.message,
        stack: err.stack
      });
    }

    try {
      const roResponse = await fetch('/locales/ro/translation.json');
      const roData = await roResponse.json();
      clientLogger.i18n('Romanian translation file loaded successfully', {
        status: roResponse.status,
        keysCount: Object.keys(roData).length,
        hasLandingKeys: !!roData.landing,
        landingKeysCount: roData.landing ? Object.keys(roData.landing).length : 0
      });
    } catch (error) {
      const err = error as Error;
      clientLogger.error('Failed to load Romanian translation file', {
        error: err.message,
        stack: err.stack
      });
    }
  }

  // Get debug statistics
  getStats() {
    return {
      totalTranslationAttempts: this.translationAttempts.size,
      failedKeysCount: this.failedKeys.size,
      loadedNamespacesCount: this.loadedNamespaces.size,
      currentLanguage: i18n.language,
      isInitialized: i18n.isInitialized
    };
  }
}

// Create singleton instance
export const i18nDebugger = new I18nDebugger();

// Run health check after initial load
setTimeout(() => {
  i18nDebugger.checkTranslationHealth();
}, 1000);