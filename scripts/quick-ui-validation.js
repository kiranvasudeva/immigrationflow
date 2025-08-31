#!/usr/bin/env node
/**
 * Quick UI Validation Script
 * 
 * Tests all pages for:
 * - HTTP status codes
 * - No mock/hardcoded data
 * - Translation completeness
 * - Basic UI functionality
 * - Data loading verification
 */

import fs from 'fs';

// Configuration
const TEST_CONFIG = {
  serverUrl: 'http://localhost:5000',
  timeout: 30000
};

// Test pages
const TEST_PAGES = [
  { path: '/', name: 'Dashboard' },
  { path: '/clients', name: 'Clients' },
  { path: '/workers', name: 'Workers' },
  { path: '/assignments', name: 'Assignments' },
  { path: '/workflow', name: 'Workflow' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/settings', name: 'Settings' }
];

console.log('🚀 Starting Quick UI Validation...');
console.log(`📍 Testing URL: ${TEST_CONFIG.serverUrl}`);
console.log(`📄 Pages to test: ${TEST_PAGES.length}`);

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

// Quick validation test
async function quickValidationTest() {
  console.log('\n🔧 Running quick validation tests...');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  for (const page of TEST_PAGES) {
    const url = `${TEST_CONFIG.serverUrl}${page.path}`;
    console.log(`  🔍 Testing ${page.name}...`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; UITestBot/1.0)'
        }
      });
      
      const html = await response.text();
      const test = {
        page: page.name,
        url,
        status: response.status,
        checks: []
      };
      
      // Check 1: HTTP Status
      if (response.ok) {
        test.checks.push({ name: 'HTTP Status', result: 'PASS', message: `${response.status} OK` });
        results.passed++;
      } else {
        test.checks.push({ name: 'HTTP Status', result: 'FAIL', message: `${response.status} Error` });
        results.failed++;
      }
      
      // Check 2: Valid HTML
      if (html.includes('<!DOCTYPE html>')) {
        test.checks.push({ name: 'Valid HTML', result: 'PASS', message: 'DOCTYPE found' });
      } else {
        test.checks.push({ name: 'Valid HTML', result: 'WARN', message: 'No DOCTYPE' });
        results.warnings++;
      }
      
      // Check 3: No mock data indicators
      const mockDataIndicators = [
        'lorem ipsum', 'placeholder', 'test@example.com', 'john doe', 'jane smith',
        'sample data', 'mock data', 'dummy data', 'fake data', '555-555-5555'
      ];
      const foundMockData = mockDataIndicators.filter(indicator => 
        html.toLowerCase().includes(indicator)
      );
      
      if (foundMockData.length === 0) {
        test.checks.push({ name: 'Real Data', result: 'PASS', message: 'No mock data detected' });
      } else {
        test.checks.push({ name: 'Real Data', result: 'FAIL', message: `Mock data found: ${foundMockData.join(', ')}` });
        results.failed++;
      }
      
      // Check 4: Translation errors
      if (html.includes('[TRANSLATION ERROR]') || html.includes('Translation not found')) {
        test.checks.push({ name: 'Translations', result: 'FAIL', message: 'Translation errors found' });
        results.failed++;
      } else {
        test.checks.push({ name: 'Translations', result: 'PASS', message: 'No translation errors' });
      }
      
      // Check 5: React hydration
      if (html.includes('id="root"') && html.includes('<script')) {
        test.checks.push({ name: 'React App', result: 'PASS', message: 'React app structure detected' });
      } else {
        test.checks.push({ name: 'React App', result: 'WARN', message: 'React app structure unclear' });
        results.warnings++;
      }
      
      // Check 6: API endpoints mentioned (indicates data loading)
      const apiEndpoints = ['/api/clients', '/api/workers', '/api/assignments', '/api/stages'];
      const mentionsAPI = apiEndpoints.some(endpoint => html.includes(endpoint));
      
      if (mentionsAPI || html.includes('fetch(')) {
        test.checks.push({ name: 'Data Loading', result: 'PASS', message: 'API integration detected' });
      } else {
        test.checks.push({ name: 'Data Loading', result: 'WARN', message: 'No clear API integration' });
        results.warnings++;
      }
      
      // Check 7: Content length (indicates real content)
      if (html.length > 5000) {
        test.checks.push({ name: 'Content Size', result: 'PASS', message: `${html.length} chars - substantial content` });
      } else if (html.length > 1000) {
        test.checks.push({ name: 'Content Size', result: 'WARN', message: `${html.length} chars - minimal content` });
        results.warnings++;
      } else {
        test.checks.push({ name: 'Content Size', result: 'FAIL', message: `${html.length} chars - very little content` });
        results.failed++;
      }
      
      // Check 8: UI framework indicators
      const uiFrameworks = ['shadcn', 'tailwind', 'radix-ui'];
      const hasUIFramework = uiFrameworks.some(fw => html.toLowerCase().includes(fw));
      
      if (hasUIFramework || html.includes('class=')) {
        test.checks.push({ name: 'UI Framework', result: 'PASS', message: 'UI framework detected' });
      } else {
        test.checks.push({ name: 'UI Framework', result: 'WARN', message: 'UI framework unclear' });
        results.warnings++;
      }
      
      results.tests.push(test);
      
      // Print individual test results
      const passCount = test.checks.filter(c => c.result === 'PASS').length;
      const failCount = test.checks.filter(c => c.result === 'FAIL').length;
      const warnCount = test.checks.filter(c => c.result === 'WARN').length;
      
      if (failCount > 0) {
        console.log(`    ❌ ${page.name} - ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);
      } else if (warnCount > 0) {
        console.log(`    ⚠️  ${page.name} - ${passCount} passed, ${warnCount} warnings`);
      } else {
        console.log(`    ✅ ${page.name} - All ${passCount} checks passed`);
      }
      
    } catch (error) {
      console.log(`    ❌ ${page.name} - Request failed: ${error.message}`);
      results.failed++;
      results.tests.push({
        page: page.name,
        url,
        status: 'ERROR',
        checks: [{ name: 'Request', result: 'FAIL', message: error.message }]
      });
    }
  }
  
  // Generate summary report
  console.log('\n📊 Validation Results Summary:');
  console.log(`   Total Pages Tested: ${TEST_PAGES.length}`);
  console.log(`   ✅ Checks Passed: ${results.passed}`);
  console.log(`   ❌ Checks Failed: ${results.failed}`);
  console.log(`   ⚠️  Warnings: ${results.warnings}`);
  
  const totalChecks = results.passed + results.failed + results.warnings;
  const successRate = totalChecks > 0 ? ((results.passed / totalChecks) * 100).toFixed(1) : 0;
  console.log(`   📈 Success Rate: ${successRate}%`);
  
  // Save detailed results
  const reportPath = './test-reports/quick-validation-report.json';
  fs.mkdirSync('./test-reports', { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalPages: TEST_PAGES.length,
      totalChecks,
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      successRate: parseFloat(successRate)
    },
    details: results.tests
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  
  // Print detailed failures
  if (results.failed > 0) {
    console.log('\n🔍 Failed Checks Details:');
    results.tests.forEach(test => {
      const failures = test.checks.filter(c => c.result === 'FAIL');
      if (failures.length > 0) {
        console.log(`   📄 ${test.page}:`);
        failures.forEach(failure => {
          console.log(`      ❌ ${failure.name}: ${failure.message}`);
        });
      }
    });
  }
  
  return results;
}

// Main execution
async function main() {
  try {
    // Check server status
    const serverReady = await checkServer();
    
    if (!serverReady) {
      console.log('❌ Server is not ready. Please ensure the application is running on', TEST_CONFIG.serverUrl);
      process.exit(1);
    }

    // Run validation tests
    const results = await quickValidationTest();
    
    if (results.failed > 0) {
      console.log('\n❌ Some validation tests failed - check the details above');
      process.exit(1);
    } else {
      console.log('\n🎉 All validation tests completed successfully!');
      
      if (results.warnings > 0) {
        console.log(`⚠️  Note: ${results.warnings} warnings were found - these may need attention`);
      }
      
      console.log('\n✨ UI validation complete - your application appears to be working correctly!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { quickValidationTest, checkServer };