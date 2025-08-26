#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LOCALES_DIR = path.join(__dirname, '../public/locales');
const SUPPORTED_LANGUAGES = ['en', 'ro'];
const NAMESPACES = ['common', 'nav', 'actions'];
const SOURCE_DIRS = [
  path.join(__dirname, '../client/src/**/*.{tsx,ts,jsx,js}')
];

// Patterns to match translation keys with namespaces
const TRANSLATION_PATTERNS = [
  /t\(['"`]([^'"`]+)['"`]/g,
  /\bt\(\s*['"`]([^'"`]+)['"`]/g,
];

function extractTranslationKeys() {
  const translationKeys = new Set();
  
  console.log('🔍 Scanning for translation keys...');
  
  SOURCE_DIRS.forEach(pattern => {
    const files = glob.sync(pattern);
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      TRANSLATION_PATTERNS.forEach(pattern => {
        let match;
        pattern.lastIndex = 0; // Reset regex state
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1];
          // Only add keys that contain namespace separators or are simple keys
          if (key.includes(':') || !key.includes('.') || NAMESPACES.some(ns => key.startsWith(ns + '.'))) {
            translationKeys.add(key);
          }
        }
      });
    });
  });
  
  return Array.from(translationKeys).sort();
}

function parseTranslationKey(key) {
  // Handle namespaced keys (ns:key or ns.key)
  if (key.includes(':')) {
    const [ns, ...keyParts] = key.split(':');
    return { namespace: ns, key: keyParts.join(':') };
  }
  
  // Handle dot notation with namespace prefix
  for (const ns of NAMESPACES) {
    if (key.startsWith(ns + '.')) {
      return { namespace: ns, key: key.substring(ns.length + 1) };
    }
  }
  
  // Default to common namespace
  return { namespace: 'common', key };
}

function loadExistingTranslations(lang, namespace) {
  const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.log(`⚠️  Could not load existing translations for ${lang}/${namespace}:`, error.message);
    return {};
  }
}

function setNestedValue(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  
  const lastKey = keys[keys.length - 1];
  if (typeof current !== 'object' || current === null) {
    return;
  }
  if (!(lastKey in current)) {
    current[lastKey] = value;
  }
}

function updateTranslationFiles(extractedKeys) {
  console.log(`📝 Updating translation files for ${SUPPORTED_LANGUAGES.length} languages...`);
  
  // Group keys by namespace
  const keysByNamespace = {};
  NAMESPACES.forEach(ns => {
    keysByNamespace[ns] = [];
  });
  
  extractedKeys.forEach(key => {
    const { namespace, key: translationKey } = parseTranslationKey(key);
    if (keysByNamespace[namespace]) {
      keysByNamespace[namespace].push(translationKey);
    }
  });
  
  // Update each namespace file for each language
  SUPPORTED_LANGUAGES.forEach(lang => {
    NAMESPACES.forEach(namespace => {
      const existing = loadExistingTranslations(lang, namespace);
      const updated = { ...existing };
      let addedCount = 0;
      
      keysByNamespace[namespace].forEach(key => {
        const keys = key.split('.');
        let current = existing;
        let exists = true;
        
        // Check if the key exists
        for (const k of keys) {
          if (current && typeof current === 'object' && k in current) {
            current = current[k];
          } else {
            exists = false;
            break;
          }
        }
        
        if (!exists) {
          const placeholder = lang === 'en' ? key : 'TODO: translate';
          setNestedValue(updated, key, placeholder);
          addedCount++;
        }
      });
      
      // Write updated translations
      const filePath = path.join(LOCALES_DIR, lang, `${namespace}.json`);
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
      
      if (addedCount > 0) {
        console.log(`✅ ${lang}/${namespace}: ${addedCount} new keys added`);
      }
    });
  });
}

function main() {
  console.log('🚀 Starting translation key extraction...\n');
  
  // Ensure locales directory structure exists
  SUPPORTED_LANGUAGES.forEach(lang => {
    const dir = path.join(LOCALES_DIR, lang);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const extractedKeys = extractTranslationKeys();
  console.log(`\n🔑 Found ${extractedKeys.length} translation keys\n`);
  
  if (extractedKeys.length > 0) {
    updateTranslationFiles(extractedKeys);
    console.log('\n🎉 Translation extraction completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the translation files in public/locales/*/');
    console.log('2. Replace "TODO: translate" placeholders with actual translations');
    console.log('3. Test your application in different languages\n');
  } else {
    console.log('⚠️  No translation keys found. Make sure you are using t("key") in your components.\n');
  }
}

main();