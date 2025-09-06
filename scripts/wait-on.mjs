#!/usr/bin/env node

/**
 * Wait for server endpoints to be available
 * Usage: node scripts/wait-on.mjs [port]
 */

const PORT = process.argv[2] || process.env.PORT || 5000;
const TIMEOUT_MS = 60000; // 60 seconds
const POLL_INTERVAL_MS = 1000; // 1 second

async function checkEndpoint(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function waitForEndpoints() {
  const healthUrl = `http://localhost:${PORT}/health`;
  const qaUrl = `http://localhost:${PORT}/qa/last-report`;
  
  console.log(`Waiting for server on port ${PORT}...`);
  console.log(`Health check: ${healthUrl}`);
  console.log(`QA endpoint: ${qaUrl}`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < TIMEOUT_MS) {
    // Check health endpoint
    const healthOk = await checkEndpoint(healthUrl);
    
    if (healthOk) {
      console.log(`✅ Health check passed`);
      
      // Check QA endpoint
      const qaOk = await checkEndpoint(qaUrl);
      if (qaOk) {
        console.log(`✅ QA endpoint available`);
        console.log(`✅ Server ready after ${Date.now() - startTime}ms`);
        process.exit(0);
      } else {
        console.log(`⚠️  Health OK, waiting for QA endpoint...`);
      }
    } else {
      console.log(`⏳ Waiting for server...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  
  console.error(`❌ Timeout after ${TIMEOUT_MS}ms`);
  process.exit(1);
}

// Handle node.js fetch
if (typeof fetch === 'undefined') {
  console.error('❌ Node.js 18+ required for fetch support');
  process.exit(1);
}

waitForEndpoints().catch(error => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});