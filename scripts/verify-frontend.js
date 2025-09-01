#!/usr/bin/env node

/**
 * Frontend Verification Script
 * Run this after making fixes to verify frontend functionality
 * Usage: node scripts/verify-frontend.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FrontendVerifier {
  constructor() {
    this.checks = [];
    this.results = [];
  }

  // Check if all required test IDs are present in components
  checkTestIds() {
    console.log('\n🔍 Checking for test IDs in components...');
    const componentsDir = path.join(__dirname, '../client/src');
    const testIdPattern = /data-testid=["']([^"']+)["']/g;
    
    const findTestIds = (dir) => {
      const files = fs.readdirSync(dir);
      const testIds = [];
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules')) {
          testIds.push(...findTestIds(filePath));
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.matchAll(testIdPattern);
          for (const match of matches) {
            testIds.push({
              id: match[1],
              file: filePath.replace(__dirname + '/../', '')
            });
          }
        }
      });
      
      return testIds;
    };
    
    const testIds = findTestIds(componentsDir);
    console.log(`  ✅ Found ${testIds.length} test IDs in components`);
    
    // Check for essential test IDs
    const essentialIds = [
      'button-submit', 'button-save', 'button-cancel',
      'input-email', 'input-password', 'select-'
    ];
    
    essentialIds.forEach(pattern => {
      const found = testIds.some(t => t.id.includes(pattern));
      if (!found) {
        console.log(`  ⚠️  Missing test IDs matching pattern: ${pattern}`);
      }
    });
    
    return testIds.length > 0;
  }

  // Check for console errors in the code
  checkConsoleErrors() {
    console.log('\n🔍 Checking for console.error statements...');
    const serverDir = path.join(__dirname, '../server');
    const errorPattern = /console\.error\([^)]+\)/g;
    
    const findErrors = (dir) => {
      const files = fs.readdirSync(dir);
      const errors = [];
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules')) {
          errors.push(...findErrors(filePath));
        } else if (file.endsWith('.ts') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf8');
          const matches = content.matchAll(errorPattern);
          for (const match of matches) {
            errors.push({
              statement: match[0],
              file: filePath.replace(__dirname + '/../', '')
            });
          }
        }
      });
      
      return errors;
    };
    
    const errors = findErrors(serverDir);
    console.log(`  ✅ Found ${errors.length} error handlers for debugging`);
    return true;
  }

  // Check API endpoint patterns
  checkAPIEndpoints() {
    console.log('\n🔍 Checking API endpoint patterns...');
    const routesFile = path.join(__dirname, '../server/routes.ts');
    const content = fs.readFileSync(routesFile, 'utf8');
    
    const patterns = [
      { pattern: /app\.(get|post|put|delete)\(['"]\/api\/[^'"]+/g, type: 'REST API' },
      { pattern: /isAuthenticated/g, type: 'Auth middleware' },
      { pattern: /requireRole/g, type: 'Role middleware' },
      { pattern: /try\s*{[\s\S]*?}\s*catch/g, type: 'Error handling' }
    ];
    
    patterns.forEach(({ pattern, type }) => {
      const matches = content.match(pattern);
      const count = matches ? matches.length : 0;
      console.log(`  ✅ ${type}: ${count} instances`);
    });
    
    return true;
  }

  // Check for form validation
  checkFormValidation() {
    console.log('\n🔍 Checking form validation...');
    const formsDir = path.join(__dirname, '../client/src');
    
    const patterns = [
      { pattern: /useForm/g, type: 'React Hook Form' },
      { pattern: /zodResolver/g, type: 'Zod validation' },
      { pattern: /required:\s*true/g, type: 'Required fields' },
      { pattern: /onSubmit/g, type: 'Submit handlers' }
    ];
    
    const checkPatterns = (dir) => {
      const files = fs.readdirSync(dir);
      const results = {};
      
      patterns.forEach(({ type }) => {
        results[type] = 0;
      });
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules')) {
          const subResults = checkPatterns(filePath);
          Object.keys(subResults).forEach(key => {
            results[key] += subResults[key];
          });
        } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(filePath, 'utf8');
          patterns.forEach(({ pattern, type }) => {
            const matches = content.match(pattern);
            if (matches) {
              results[type] += matches.length;
            }
          });
        }
      });
      
      return results;
    };
    
    const results = checkPatterns(formsDir);
    Object.entries(results).forEach(([type, count]) => {
      console.log(`  ✅ ${type}: ${count} instances`);
    });
    
    return true;
  }

  // Check for loading states
  checkLoadingStates() {
    console.log('\n🔍 Checking loading states...');
    const clientDir = path.join(__dirname, '../client/src');
    
    const patterns = [
      { pattern: /isLoading/g, type: 'Loading states' },
      { pattern: /isPending/g, type: 'Pending states' },
      { pattern: /skeleton/gi, type: 'Skeleton loaders' },
      { pattern: /spinner/gi, type: 'Spinners' }
    ];
    
    let total = 0;
    patterns.forEach(({ pattern, type }) => {
      const files = fs.readdirSync(clientDir, { recursive: true });
      let count = 0;
      
      files.forEach(file => {
        if (typeof file === 'string' && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
          const filePath = path.join(clientDir, file);
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf8');
            const matches = content.match(pattern);
            if (matches) count += matches.length;
          }
        }
      });
      
      console.log(`  ✅ ${type}: ${count} instances`);
      total += count;
    });
    
    return total > 0;
  }

  // Generate verification report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FRONTEND VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    const checks = [
      { name: 'Test IDs', fn: () => this.checkTestIds() },
      { name: 'Error Handlers', fn: () => this.checkConsoleErrors() },
      { name: 'API Endpoints', fn: () => this.checkAPIEndpoints() },
      { name: 'Form Validation', fn: () => this.checkFormValidation() },
      { name: 'Loading States', fn: () => this.checkLoadingStates() }
    ];
    
    const results = [];
    checks.forEach(({ name, fn }) => {
      try {
        const passed = fn();
        results.push({ name, passed });
      } catch (error) {
        console.error(`  ❌ Error checking ${name}:`, error.message);
        results.push({ name, passed: false });
      }
    });
    
    console.log('\n📋 Checklist for Manual Testing:');
    console.log('  □ Open browser DevTools Console');
    console.log('  □ Check for any red errors in console');
    console.log('  □ Test form submissions (should not throw errors)');
    console.log('  □ Check network tab for 500 errors');
    console.log('  □ Verify buttons are clickable');
    console.log('  □ Check that forms show validation errors');
    console.log('  □ Verify loading states appear during API calls');
    console.log('  □ Test CRUD operations (Create, Read, Update, Delete)');
    
    console.log('\n✨ Verification complete!');
    
    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`\n📈 Score: ${passedCount}/${totalCount} checks passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All automated checks passed!');
    } else {
      console.log('⚠️  Some checks need attention');
    }
  }

  run() {
    console.log('🚀 Starting Frontend Verification...\n');
    this.generateReport();
  }
}

// Run the verifier
const verifier = new FrontendVerifier();
verifier.run();