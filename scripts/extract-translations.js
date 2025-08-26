#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Configuration
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../public/locales');
const SUPPORTED_LANGUAGES = ['en', 'ro', 'es', 'fr'];
const SOURCE_DIRS = [
  path.join(__dirname, '../client/src/**/*.{tsx,ts}'),
  path.join(__dirname, '../client/src/**/*.{jsx,js}')
];

// Patterns to match translation keys
const TRANSLATION_PATTERNS = [
  /t\(['"`]([^'"`]+)['"`]\)/g,
  /\bt\(\s*['"`]([^'"`]+)['"`]/g,
  /useTranslation.*t\(['"`]([^'"`]+)['"`]\)/g,
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
        while ((match = pattern.exec(content)) !== null) {
          translationKeys.add(match[1]);
        }
      });
    });
  });
  
  return Array.from(translationKeys).sort();
}

function loadExistingTranslations(lang) {
  const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
  
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.log(`⚠️  Could not load existing translations for ${lang}:`, error.message);
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
    return; // Cannot set on non-object
  }
  if (!(lastKey in current)) {
    current[lastKey] = value;
  }
}

function getNestedValue(obj, keyPath) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

function updateTranslationFiles(extractedKeys) {
  console.log(`📝 Updating translation files for ${SUPPORTED_LANGUAGES.length} languages...`);
  
  SUPPORTED_LANGUAGES.forEach(lang => {
    const existing = loadExistingTranslations(lang);
    const updated = { ...existing };
    
    let addedCount = 0;
    
    extractedKeys.forEach(key => {
      const existingValue = getNestedValue(existing, key);
      if (existingValue === undefined) {
        const placeholder = lang === 'en' ? key : 'TODO: translate';
        setNestedValue(updated, key, placeholder);
        addedCount++;
      }
    });
    
    // Write updated translations
    const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');
    
    console.log(`✅ ${lang}: ${addedCount} new keys added`);
  });
}

function main() {
  console.log('🚀 Starting translation key extraction...\n');
  
  // Ensure locales directory exists
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
    console.log('1. Review the translation files in public/locales/*/translation.json');
    console.log('2. Replace "TODO: translate" placeholders with actual translations');
    console.log('3. Test your application in different languages\n');
  } else {
    console.log('⚠️  No translation keys found. Make sure you are using t("key") in your components.\n');
  }
}

// Run the main function directly since this is an ES module
main();