#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for better output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class TranslationTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = [];
    this.translationKeys = new Set();
    this.usedKeys = new Set();
    this.languages = ['en', 'ro', 'es', 'fr'];
    this.serverUrl = 'http://localhost:5000';
  }

  log(message, color = colors.white) {
    console.log(`${color}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`❌ ERROR: ${message}`, colors.red);
  }

  warning(message) {
    this.warnings.push(message);
    this.log(`⚠️  WARNING: ${message}`, colors.yellow);
  }

  success(message) {
    this.passed.push(message);
    this.log(`✅ PASS: ${message}`, colors.green);
  }

  info(message) {
    this.log(`ℹ️  INFO: ${message}`, colors.blue);
  }

  async testDatabaseTranslations() {
    this.log(`${colors.bold}=== Testing Database Translations ===${colors.reset}`, colors.cyan);
    
    try {
      const response = await fetch(`${this.serverUrl}/api/translations`);
      if (!response.ok) {
        this.error(`Failed to fetch translations from database: ${response.status}`);
        return;
      }

      const translations = await response.json();
      this.info(`Found ${translations.length} translation entries in database`);

      // Group by language and key
      const translationMap = {};
      translations.forEach(t => {
        if (!translationMap[t.language]) {
          translationMap[t.language] = {};
        }
        translationMap[t.language][t.key] = t.value;
        this.translationKeys.add(t.key);
      });

      // Check if all languages have the same keys
      const languages = Object.keys(translationMap);
      if (languages.length === 0) {
        this.error('No translations found in database');
        return;
      }

      this.info(`Languages in database: ${languages.join(', ')}`);

      // Check for missing languages
      this.languages.forEach(lang => {
        if (!translationMap[lang]) {
          this.error(`Language '${lang}' missing from database`);
        }
      });

      // Check for key consistency across languages
      const allKeys = [...this.translationKeys];
      languages.forEach(lang => {
        const langKeys = Object.keys(translationMap[lang]);
        allKeys.forEach(key => {
          if (!langKeys.includes(key)) {
            this.error(`Key '${key}' missing for language '${lang}'`);
          } else if (!translationMap[lang][key] || translationMap[lang][key].trim() === '') {
            this.error(`Key '${key}' has empty value for language '${lang}'`);
          }
        });
      });

      // Check for critical navigation keys
      const criticalNavKeys = [
        'nav.requirements', 'nav.reminders', 'nav.auditLogs', 
        'nav.dashboard', 'nav.clients', 'nav.workers', 'nav.templates', 
        'nav.analytics', 'nav.deadlines', 'nav.profile'
      ];

      criticalNavKeys.forEach(key => {
        if (this.translationKeys.has(key)) {
          this.success(`Critical navigation key '${key}' exists in database`);
        } else {
          this.error(`Critical navigation key '${key}' missing from database`);
        }
      });

    } catch (error) {
      this.error(`Database translation test failed: ${error.message}`);
    }
  }

  async testLanguageContext() {
    this.log(`${colors.bold}=== Testing Language Context Fallbacks ===${colors.reset}`, colors.cyan);
    
    try {
      const contextPath = path.join(process.cwd(), 'client/src/contexts/LanguageContext.tsx');
      if (!fs.existsSync(contextPath)) {
        this.error(`LanguageContext.tsx not found at ${contextPath}`);
        return;
      }

      const contextContent = fs.readFileSync(contextPath, 'utf8');
      
      // Extract translation keys from fallback translations
      const fallbackTranslations = {};
      this.languages.forEach(lang => {
        fallbackTranslations[lang] = new Set();
        
        // Find the language section (simplified regex approach)
        const langRegex = new RegExp(`${lang}:\\s*\\{[\\s\\S]*?\\}(?=\\s*,?\\s*\\}|\\s*,?\\s*[a-z]+:)`, 'i');
        const langMatch = contextContent.match(langRegex);
        
        if (langMatch) {
          // Extract keys from the language section
          const keyRegex = /'([^']+)':/g;
          let match;
          while ((match = keyRegex.exec(langMatch[0])) !== null) {
            fallbackTranslations[lang].add(match[1]);
          }
          this.info(`Found ${fallbackTranslations[lang].size} fallback keys for language '${lang}'`);
        } else {
          this.error(`Language '${lang}' section not found in LanguageContext`);
        }
      });

      // Check for key consistency in fallbacks
      const allFallbackKeys = new Set();
      Object.values(fallbackTranslations).forEach(langSet => {
        langSet.forEach(key => allFallbackKeys.add(key));
      });

      this.languages.forEach(lang => {
        allFallbackKeys.forEach(key => {
          if (!fallbackTranslations[lang].has(key)) {
            this.warning(`Fallback key '${key}' missing for language '${lang}' in LanguageContext`);
          }
        });
      });

      // Check critical navigation keys in fallbacks
      const criticalNavKeys = [
        'nav.requirements', 'nav.reminders', 'nav.auditLogs'
      ];

      criticalNavKeys.forEach(key => {
        let foundInAll = true;
        this.languages.forEach(lang => {
          if (!fallbackTranslations[lang].has(key)) {
            foundInAll = false;
            this.error(`Critical fallback key '${key}' missing for language '${lang}'`);
          }
        });
        if (foundInAll) {
          this.success(`Critical fallback key '${key}' exists for all languages`);
        }
      });

    } catch (error) {
      this.error(`LanguageContext test failed: ${error.message}`);
    }
  }

  async testComponentUsage() {
    this.log(`${colors.bold}=== Testing Component Translation Usage ===${colors.reset}`, colors.cyan);
    
    try {
      const clientDir = path.join(process.cwd(), 'client/src');
      if (!fs.existsSync(clientDir)) {
        this.error(`Client source directory not found at ${clientDir}`);
        return;
      }

      const findUsedKeys = (dir) => {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && file !== 'node_modules') {
            findUsedKeys(filePath);
          } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Find t('key') usage
            const tRegex = /t\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
            let match;
            while ((match = tRegex.exec(content)) !== null) {
              this.usedKeys.add(match[1]);
            }

            // Check for hardcoded strings (potential translation keys)
            const hardcodedRegex = />[A-Z][^<{$]*</g;
            const hardcodedMatches = content.match(hardcodedRegex);
            if (hardcodedMatches && hardcodedMatches.length > 0) {
              // Filter out likely hardcoded text vs translation keys
              const suspiciousText = hardcodedMatches
                .map(m => m.slice(1, -1))
                .filter(text => 
                  text.length > 2 && 
                  text.length < 50 && 
                  !text.includes('className') && 
                  !text.includes('data-') &&
                  text.match(/^[A-Z]/)
                );
              
              if (suspiciousText.length > 0) {
                const relativePath = path.relative(process.cwd(), filePath);
                this.warning(`Potential untranslated text in ${relativePath}: ${suspiciousText.slice(0, 3).join(', ')}${suspiciousText.length > 3 ? '...' : ''}`);
              }
            }
          }
        });
      };

      findUsedKeys(clientDir);
      this.info(`Found ${this.usedKeys.size} unique translation keys used in components`);

      // Check if used keys exist in database or fallbacks
      this.usedKeys.forEach(key => {
        if (this.translationKeys.has(key)) {
          this.success(`Used key '${key}' exists in database`);
        } else {
          this.warning(`Used key '${key}' not found in database (may rely on fallbacks)`);
        }
      });

    } catch (error) {
      this.error(`Component usage test failed: ${error.message}`);
    }
  }

  async testServerConnection() {
    this.log(`${colors.bold}=== Testing Server Connection ===${colors.reset}`, colors.cyan);
    
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        this.success('Server is running and accessible');
      } else {
        this.error(`Server health check failed: ${response.status}`);
      }
    } catch (error) {
      this.error(`Cannot connect to server at ${this.serverUrl}: ${error.message}`);
    }
  }

  async testTranslationEndpoint() {
    this.log(`${colors.bold}=== Testing Translation API Endpoint ===${colors.reset}`, colors.cyan);
    
    try {
      const response = await fetch(`${this.serverUrl}/api/translations`);
      
      if (!response.ok) {
        this.error(`Translation API returned status ${response.status}`);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.error(`Translation API returned non-JSON content: ${contentType}`);
        return;
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        this.error('Translation API did not return an array');
        return;
      }

      this.success(`Translation API working correctly, returned ${data.length} entries`);

    } catch (error) {
      this.error(`Translation API test failed: ${error.message}`);
    }
  }

  printSummary() {
    this.log(`${colors.bold}=== TEST SUMMARY ===${colors.reset}`, colors.cyan);
    this.log(`${colors.green}Passed: ${this.passed.length}${colors.reset}`);
    this.log(`${colors.yellow}Warnings: ${this.warnings.length}${colors.reset}`);
    this.log(`${colors.red}Errors: ${this.errors.length}${colors.reset}`);
    
    if (this.errors.length > 0) {
      this.log(`${colors.bold}Critical Issues:${colors.reset}`, colors.red);
      this.errors.slice(0, 10).forEach(error => {
        this.log(`  • ${error}`, colors.red);
      });
      if (this.errors.length > 10) {
        this.log(`  ... and ${this.errors.length - 10} more errors`, colors.red);
      }
    }

    if (this.warnings.length > 0) {
      this.log(`${colors.bold}Warnings to Address:${colors.reset}`, colors.yellow);
      this.warnings.slice(0, 5).forEach(warning => {
        this.log(`  • ${warning}`, colors.yellow);
      });
      if (this.warnings.length > 5) {
        this.log(`  ... and ${this.warnings.length - 5} more warnings`, colors.yellow);
      }
    }

    const score = Math.round(((this.passed.length) / (this.passed.length + this.warnings.length + this.errors.length)) * 100);
    this.log(`${colors.bold}Translation System Health Score: ${score}%${colors.reset}`, 
      score >= 90 ? colors.green : score >= 70 ? colors.yellow : colors.red);
  }

  async runAllTests() {
    this.log(`${colors.bold}🔍 Starting Comprehensive Translation System Test${colors.reset}`, colors.magenta);
    this.log(`${colors.bold}================================================${colors.reset}`, colors.magenta);
    
    await this.testServerConnection();
    await this.testTranslationEndpoint();
    await this.testDatabaseTranslations();
    await this.testLanguageContext();
    await this.testComponentUsage();
    
    this.log(`${colors.bold}================================================${colors.reset}`, colors.magenta);
    this.printSummary();
    
    return this.errors.length === 0;
  }
}

// Main execution
async function main() {
  const tester = new TranslationTester();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

// Add fetch polyfill for Node.js if needed
if (!global.fetch) {
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
}

// Check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}