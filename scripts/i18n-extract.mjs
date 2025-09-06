#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Extract keys from t('key') usage in client code
function extractKeysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const keys = new Set();
  
  // Match t('key'), t("key"), t(`key`)
  const tRegex = /t\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    keys.add(match[1]);
  }
  
  return keys;
}

// Scan client directory for translation keys
function scanClientFiles() {
  const clientDir = path.join(projectRoot, 'client/src');
  const usedKeys = new Set();
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (fullPath.match(/\.(ts|tsx|js|jsx)$/)) {
        const fileKeys = extractKeysFromFile(fullPath);
        fileKeys.forEach(key => usedKeys.add(key));
      }
    }
  }
  
  scanDirectory(clientDir);
  return usedKeys;
}

// Load existing translations
function loadTranslations(lang) {
  const localeDir = path.join(projectRoot, 'public/locales', lang);
  const translations = {};
  
  if (fs.existsSync(localeDir)) {
    const files = fs.readdirSync(localeDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(localeDir, file), 'utf8'));
        const namespace = path.basename(file, '.json');
        translations[namespace] = content;
      } catch (error) {
        console.warn(`Warning: Could not parse ${lang}/${file}`);
      }
    }
  }
  
  return translations;
}

// Check if a key exists in translations (supports nested keys)
function hasKey(translations, key) {
  const parts = key.split('.');
  let current = translations;
  
  for (const part of parts) {
    if (current[part] === undefined) {
      return false;
    }
    current = current[part];
  }
  
  return true;
}

// Humanize a key for default English value
function humanizeKey(key) {
  return key.split('.').pop().replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// Add missing keys to translation files
function addMissingKeys(lang, missingKeys) {
  const localeDir = path.join(projectRoot, 'public/locales', lang);
  if (!fs.existsSync(localeDir)) {
    fs.mkdirSync(localeDir, { recursive: true });
  }
  
  const fileKeys = {};
  
  // Group keys by namespace (first part before dot)
  for (const key of missingKeys) {
    const parts = key.split('.');
    const namespace = parts.length > 1 ? parts[0] : 'common';
    const keyPath = parts.length > 1 ? parts.slice(1).join('.') : key;
    
    if (!fileKeys[namespace]) {
      fileKeys[namespace] = [];
    }
    fileKeys[namespace].push({ fullKey: key, keyPath, value: lang === 'en' ? humanizeKey(key) : humanizeKey(key) });
  }
  
  // Update each namespace file
  for (const [namespace, keys] of Object.entries(fileKeys)) {
    const filePath = path.join(localeDir, `${namespace}.json`);
    let content = {};
    
    // Load existing content
    if (fs.existsSync(filePath)) {
      try {
        content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (error) {
        console.warn(`Warning: Could not parse ${filePath}, starting fresh`);
      }
    }
    
    // Add missing keys
    let added = 0;
    for (const { keyPath, value } of keys) {
      if (!hasNestedKey(content, keyPath)) {
        setNestedKey(content, keyPath, value);
        added++;
      }
    }
    
    if (added > 0) {
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
      console.log(`✅ Added ${added} missing keys to ${lang}/${namespace}.json`);
    }
  }
}

// Helper to check nested keys
function hasNestedKey(obj, keyPath) {
  const parts = keyPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current[part] === undefined) return false;
    current = current[part];
  }
  return true;
}

// Helper to set nested keys
function setNestedKey(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

// Main execution
console.log('🔍 Extracting translation keys from client code...');

const usedKeys = scanClientFiles();
console.log(`Found ${usedKeys.size} unique translation keys in use`);

// Check against English translations
const enTranslations = loadTranslations('en');
const roTranslations = loadTranslations('ro');

const missingInEn = [];
const missingInRo = [];

for (const key of usedKeys) {
  // Check all namespaces for the key
  let foundInEn = false;
  let foundInRo = false;
  
  for (const [namespace, content] of Object.entries(enTranslations)) {
    if (hasKey(content, key.replace(/^[^.]+\./, ''))) {
      foundInEn = true;
      break;
    }
  }
  
  for (const [namespace, content] of Object.entries(roTranslations)) {
    if (hasKey(content, key.replace(/^[^.]+\./, ''))) {
      foundInRo = true;
      break;
    }
  }
  
  if (!foundInEn) missingInEn.push(key);
  if (!foundInRo) missingInRo.push(key);
}

console.log(`Missing in English: ${missingInEn.length}`);
console.log(`Missing in Romanian: ${missingInRo.length}`);

// Add missing keys
if (missingInEn.length > 0) {
  addMissingKeys('en', missingInEn);
}

if (missingInRo.length > 0) {
  addMissingKeys('ro', missingInRo);
}

console.log('✅ Translation extraction complete!');