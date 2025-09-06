#!/usr/bin/env node

/**
 * Regression check script - Validates QA tests pass
 * Usage: node scripts/regression-check.mjs [port]
 * 
 * Expected: 13/13 tests PASS
 * Exit code 0 = success, 1 = failure
 */

const PORT = process.argv[2] || process.env.PORT || 5000;
const EXPECTED_TESTS = 13;

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function checkHealth() {
  const healthUrl = `http://localhost:${PORT}/health`;
  
  try {
    await makeRequest(healthUrl);
    return true;
  } catch (error) {
    console.warn(`⚠️  Health check failed: ${error.message}`);
    return false;
  }
}

async function runQATests() {
  const qaRunUrl = `http://localhost:${PORT}/qa/run`;
  
  console.log(`Running QA tests: POST ${qaRunUrl}`);
  
  try {
    const result = await makeRequest(qaRunUrl, { method: 'POST' });
    
    if (!result || !result.report) {
      throw new Error('Invalid QA response format');
    }
    
    return result.report;
  } catch (error) {
    throw new Error(`QA run failed: ${error.message}`);
  }
}

function validateReport(report) {
  const { totalTests, passed, failed, timestamp } = report;
  
  console.log(`\n📊 QA Report from ${timestamp}:`);
  console.log(`   Total: ${totalTests}, Passed: ${passed}, Failed: ${failed}`);
  
  if (totalTests !== EXPECTED_TESTS) {
    console.error(`❌ Expected ${EXPECTED_TESTS} tests, got ${totalTests}`);
    return false;
  }
  
  if (failed > 0) {
    console.error(`❌ ${failed} tests failed`);
    
    // Show failed tests
    const failedTests = report.tests?.filter(t => t.status === 'FAIL') || [];
    failedTests.forEach(test => {
      console.error(`   ❌ ${test.name}: ${test.details}`);
    });
    
    return false;
  }
  
  if (passed !== totalTests) {
    console.error(`❌ Inconsistent count: ${passed} passed != ${totalTests} total`);
    return false;
  }
  
  return true;
}

async function main() {
  const startTime = Date.now();
  
  console.log(`🔍 Regression Check - Expected: ${EXPECTED_TESTS}/13 PASS`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  
  // Check if server is running
  const healthOk = await checkHealth();
  if (!healthOk) {
    console.error(`❌ Server not responding on port ${PORT}`);
    console.error(`💡 Ensure server is running: npm run dev`);
    process.exit(1);
  }
  
  console.log(`✅ Server health check passed`);
  
  // Run QA tests
  let report;
  try {
    report = await runQATests();
  } catch (error) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }
  
  // Validate results
  const isValid = validateReport(report);
  const duration = Date.now() - startTime;
  
  if (isValid) {
    console.log(`\n✅ QA PASS ${report.passed}/${report.totalTests} (${duration}ms)`);
    console.log(`🎯 All regression tests passed!`);
    process.exit(0);
  } else {
    console.log(`\n❌ QA FAIL ${report.passed}/${report.totalTests} (${duration}ms)`);
    console.log(`🚨 Regression detected!`);
    process.exit(1);
  }
}

// Handle node.js fetch
if (typeof fetch === 'undefined') {
  console.error('❌ Node.js 18+ required for fetch support');
  process.exit(1);
}

main().catch(error => {
  console.error(`❌ Unexpected error: ${error.message}`);
  process.exit(1);
});