#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';

async function testFullyLoadedFrontend() {
  console.log('🚀 Starting Puppeteer Frontend Test (Fully Rendered)...');
  console.log('📍 Testing URL: http://localhost:5000');
  
  let browser;
  let results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { passed: 0, failed: 0 }
  };

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1200, height: 800 });
    
    const pages = [
      { name: 'Settings', path: '/settings', checkWorkflows: true },
      { name: 'Dashboard', path: '/', checkWorkflows: false },
      { name: 'Clients', path: '/clients', checkWorkflows: false },
      { name: 'Workers', path: '/workers', checkWorkflows: false }
    ];

    for (const testPage of pages) {
      console.log(`\n📄 Testing page: ${testPage.name} (${testPage.path})`);
      
      try {
        // Navigate to page
        console.log(`   🔗 Loading: http://localhost:5000${testPage.path}`);
        await page.goto(`http://localhost:5000${testPage.path}`, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for React to load and render
        await page.waitForTimeout(2000);
        
        // Wait for any API calls to complete
        await page.waitForSelector('body', { timeout: 10000 });
        
        // Get page title
        const title = await page.title();
        console.log(`   📋 Page title: ${title}`);
        
        // Check for navigation elements
        const hasNavigation = await page.$('nav, .navigation, [data-testid*="nav"]') !== null;
        console.log(`   🧭 Has navigation: ${hasNavigation ? '✅' : '❌'}`);
        
        // Check for any error messages or loading states
        const errorElements = await page.$$eval('*', (elements) => {
          return elements.filter(el => 
            el.textContent && (
              el.textContent.includes('Error') ||
              el.textContent.includes('Failed') ||
              el.textContent.includes('Something went wrong')
            )
          ).map(el => el.textContent.trim()).slice(0, 3);
        });
        
        const loadingElements = await page.$$eval('*', (elements) => {
          return elements.filter(el => 
            el.textContent && (
              el.textContent.includes('Loading') ||
              el.textContent.includes('loading') ||
              el.textContent.includes('Fetching')
            )
          ).map(el => el.textContent.trim()).slice(0, 3);
        });

        console.log(`   ⚠️  Errors found: ${errorElements.length > 0 ? errorElements.join(', ') : 'None'}`);
        console.log(`   ⏳ Loading states: ${loadingElements.length > 0 ? loadingElements.join(', ') : 'None'}`);

        // Special workflow checking for Settings page
        let workflowData = null;
        if (testPage.checkWorkflows) {
          console.log(`   🔍 Analyzing workflow templates...`);
          
          // Wait a bit more for API data to load
          await page.waitForTimeout(3000);
          
          // Look for workflow templates in the rendered content
          workflowData = await page.evaluate(() => {
            const workflows = [];
            const stageElements = document.querySelectorAll('*');
            
            let currentWorkflow = null;
            let romanianWorkflows = 0;
            let debugWorkflows = 0;
            let totalWorkflows = 0;
            
            for (const el of stageElements) {
              const text = el.textContent || '';
              
              // Look for workflow names
              if (text.includes('Romanian') && (text.includes('Work Permit') || text.includes('Citizenship'))) {
                romanianWorkflows++;
                totalWorkflows++;
                
                // Look for stage count in nearby elements
                const parent = el.closest('div') || el.parentElement;
                if (parent) {
                  const siblings = parent.querySelectorAll('*');
                  for (const sibling of siblings) {
                    const siblingText = sibling.textContent || '';
                    if (siblingText.includes('Stages:')) {
                      const stageMatch = siblingText.match(/Stages:\s*(\d+)/);
                      if (stageMatch) {
                        workflows.push({
                          name: text.trim(),
                          stages: parseInt(stageMatch[1]),
                          type: 'Romanian'
                        });
                      }
                    }
                  }
                }
              }
              
              // Look for debug workflows
              if (text.includes('DEBUG') && !text.includes('Romanian')) {
                debugWorkflows++;
                totalWorkflows++;
                
                const parent = el.closest('div') || el.parentElement;
                if (parent) {
                  const siblings = parent.querySelectorAll('*');
                  for (const sibling of siblings) {
                    const siblingText = sibling.textContent || '';
                    if (siblingText.includes('Stages:')) {
                      const stageMatch = siblingText.match(/Stages:\s*(\d+)/);
                      if (stageMatch) {
                        workflows.push({
                          name: text.trim(),
                          stages: parseInt(stageMatch[1]),
                          type: 'Debug'
                        });
                      }
                    }
                  }
                }
              }
            }
            
            return {
              workflows,
              romanianCount: romanianWorkflows,
              debugCount: debugWorkflows,
              totalCount: totalWorkflows
            };
          });
          
          console.log(`   📊 Total workflows detected: ${workflowData.totalCount}`);
          console.log(`   🇷🇴 Romanian workflows: ${workflowData.romanianCount}`);
          console.log(`   🐛 Debug workflows: ${workflowData.debugCount}`);
          
          if (workflowData.workflows.length > 0) {
            console.log(`   📋 Workflow details:`);
            workflowData.workflows.forEach(w => {
              console.log(`      • ${w.name}: ${w.stages} stages`);
            });
          }
        }

        // Get page content length
        const bodyText = await page.evaluate(() => document.body.textContent || '');
        const contentLength = bodyText.length;
        console.log(`   📄 Content length: ${contentLength} characters`);
        
        // Determine if test passed
        const hasContent = contentLength > 100;
        const noErrors = errorElements.length === 0;
        const notStuckLoading = !bodyText.includes('Loading workflow templates...') || testPage.path !== '/settings';
        
        const passed = hasContent && noErrors && notStuckLoading;
        
        if (passed) {
          console.log(`   ✅ ${testPage.name} - PASSED`);
          results.summary.passed++;
        } else {
          console.log(`   ❌ ${testPage.name} - FAILED`);
          results.summary.failed++;
        }
        
        results.tests.push({
          page: testPage.name,
          path: testPage.path,
          passed,
          title,
          hasNavigation,
          contentLength,
          errors: errorElements,
          loadingStates: loadingElements,
          workflowData: workflowData
        });
        
      } catch (error) {
        console.log(`   ❌ ${testPage.name} - ERROR: ${error.message}`);
        results.summary.failed++;
        results.tests.push({
          page: testPage.name,
          path: testPage.path,
          passed: false,
          error: error.message
        });
      }
    }

    // API Test
    console.log(`\n🔌 Testing Workflow Templates API...`);
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/workflow-templates');
        const data = await response.json();
        return {
          status: response.status,
          count: data.length,
          workflows: data.map(w => ({
            name: w.name,
            stages: w.stages?.length || 0
          }))
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (apiResponse.error) {
      console.log(`   ❌ API Error: ${apiResponse.error}`);
    } else {
      console.log(`   ✅ API Response: ${apiResponse.status}`);
      console.log(`   📊 Templates returned: ${apiResponse.count}`);
      
      const romanianWorkflows = apiResponse.workflows.filter(w => w.name.includes('Romanian'));
      romanianWorkflows.forEach(w => {
        console.log(`   🇷🇴 ${w.name}: ${w.stages} stages`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print summary
  console.log(`\n📊 PUPPETEER FRONTEND TEST RESULTS`);
  console.log('================================================================================');
  console.log(`✅ Tests Passed: ${results.summary.passed}`);
  console.log(`❌ Tests Failed: ${results.summary.failed}`);
  console.log(`📈 Success Rate: ${((results.summary.passed / (results.summary.passed + results.summary.failed)) * 100).toFixed(1)}%`);
  
  // Save detailed report
  const reportPath = `test-reports/puppeteer-frontend-test-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Report saved: ${reportPath}`);
  
  console.log(`\n🎉 Test completed successfully!`);
  console.log(`📄 Full report: ${reportPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testFullyLoadedFrontend().catch(console.error);
}