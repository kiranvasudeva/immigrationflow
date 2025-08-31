#!/usr/bin/env node
/**
 * Quick UI Test Runner
 * 
 * Runs the comprehensive UI test suite with proper configuration for Replit environment.
 * This script will test all pages, screen sizes, and verify data integrity.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEST_CONFIG = {
  serverUrl: 'http://localhost:5000',
  headless: true, // Run headless in Replit environment
  timeout: 30000,
  maxRetries: 3
};

// Test pages to verify
const TEST_PAGES = [
  '/',
  '/clients', 
  '/workers',
  '/assignments',
  '/workflow',
  '/analytics',
  '/settings'
];

console.log('🚀 Starting UI Test Suite...');
console.log(`📍 Testing URL: ${TEST_CONFIG.serverUrl}`);
console.log(`📄 Pages to test: ${TEST_PAGES.length}`);
console.log(`⚙️  Configuration: headless=${TEST_CONFIG.headless}, timeout=${TEST_CONFIG.timeout}ms`);

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${TEST_CONFIG.serverUrl}/health`);
    if (response.ok) {
      console.log('✅ Server is running and healthy');
      return true;
    }
  } catch (error) {
    console.log('❌ Server not responding:', error.message);
    return false;
  }
}

// Run the comprehensive test
async function runTests() {
  console.log('\n🔍 Checking server status...');
  const serverReady = await checkServer();
  
  if (!serverReady) {
    console.log('❌ Server is not ready. Please ensure the application is running on', TEST_CONFIG.serverUrl);
    process.exit(1);
  }

  console.log('\n🎯 Starting comprehensive UI tests...');
  
  // Run the test script
  const testProcess = spawn('node', ['scripts/comprehensive-ui-test.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: 'false',
      PUPPETEER_EXECUTABLE_PATH: '/usr/bin/chromium-browser'
    }
  });

  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 All tests completed successfully!');
      console.log('\n📊 Check the following for results:');
      console.log('   - ./test-screenshots/ for visual verification');
      console.log('   - ./test-reports/ for detailed HTML and JSON reports');
    } else {
      console.log(`\n❌ Tests failed with exit code ${code}`);
    }
    process.exit(code);
  });

  testProcess.on('error', (error) => {
    console.error('❌ Failed to start test process:', error.message);
    process.exit(1);
  });
}

// Quick validation test (fallback if Puppeteer fails)
async function quickValidationTest() {
  console.log('\n🔧 Running quick validation tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  for (const page of TEST_PAGES) {
    const url = `${TEST_CONFIG.serverUrl}${page}`;
    console.log(`  🔍 Testing ${page}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UITestBot/1.0)'
        }
      });
      
      const html = await response.text();
      const test = {
        page,
        url,
        status: response.status,
        checks: []
      };
      
      // Basic checks
      if (response.ok) {
        test.checks.push({ name: 'HTTP Status', result: 'PASS', message: `${response.status} OK` });
        results.passed++;
      } else {
        test.checks.push({ name: 'HTTP Status', result: 'FAIL', message: `${response.status} Error` });
        results.failed++;
      }
      
      // Content checks
      if (html.includes('<!DOCTYPE html>')) {
        test.checks.push({ name: 'Valid HTML', result: 'PASS', message: 'DOCTYPE found' });
      } else {
        test.checks.push({ name: 'Valid HTML', result: 'WARN', message: 'No DOCTYPE' });
        results.warnings++;
      }
      
      // Check for possible mock data
      const mockDataIndicators = ['lorem ipsum', 'placeholder', 'test@example.com', 'john doe'];
      const foundMockData = mockDataIndicators.filter(indicator => 
        html.toLowerCase().includes(indicator)
      );
      
      if (foundMockData.length === 0) {
        test.checks.push({ name: 'Real Data', result: 'PASS', message: 'No mock data detected' });
      } else {
        test.checks.push({ name: 'Real Data', result: 'WARN', message: `Possible mock data: ${foundMockData.join(', ')}` });
        results.warnings++;
      }
      
      // Check for translation errors
      if (html.includes('[TRANSLATION ERROR]') || html.includes('Translation not found')) {
        test.checks.push({ name: 'Translations', result: 'FAIL', message: 'Translation errors found' });
        results.failed++;
      } else {
        test.checks.push({ name: 'Translations', result: 'PASS', message: 'No translation errors' });
      }
      
      results.tests.push(test);
      console.log(`    ✅ ${page} - Basic checks completed`);
      
    } catch (error) {
      console.log(`    ❌ ${page} - Failed: ${error.message}`);
      results.failed++;
      results.tests.push({
        page,
        url,
        status: 'ERROR',
        checks: [{ name: 'Request', result: 'FAIL', message: error.message }]
      });
    }
  }
  
  // Generate quick report
  console.log('\n📊 Quick Validation Results:');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  
  // Save results
  const reportPath = './test-reports/quick-validation-report.json';
  fs.mkdirSync('./test-reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Quick report saved to: ${reportPath}`);
  
  return results;
}

// Main execution
async function main() {
  try {
    // Try comprehensive test first
    await runTests();
  } catch (error) {
    console.log('\n⚠️  Comprehensive test failed, running quick validation...');
    console.log('Error:', error.message);
    
    // Fallback to quick validation
    const results = await quickValidationTest();
    
    if (results.failed > 0) {
      console.log('\n❌ Some validation tests failed');
      process.exit(1);
    } else {
      console.log('\n✅ Quick validation completed successfully');
      process.exit(0);
    }
  }
}

// Export for programmatic use
export { runTests, quickValidationTest, checkServer, TEST_CONFIG };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}