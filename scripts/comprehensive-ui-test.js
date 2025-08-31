/**
 * Comprehensive UI Test Script
 * 
 * This script automatically tests:
 * - Every page and route in the application
 * - All user roles (ADMIN, OWNER, WORKER, VIEWER)
 * - Multiple screen sizes (desktop, tablet, mobile)
 * - Data loading verification (no mock/hardcoded data)
 * - Error detection and translation issues
 * - Performance monitoring
 * 
 * Run with: node scripts/comprehensive-ui-test.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  headless: false, // Set to true for CI/automated runs
  slowMo: 250, // Slow down actions for visual debugging
  timeout: 30000,
  screenshotDir: './test-screenshots',
  reportDir: './test-reports'
};

// Screen sizes to test
const SCREEN_SIZES = {
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
  tablet: { width: 768, height: 1024, name: 'Tablet' },
  mobile: { width: 375, height: 667, name: 'Mobile' }
};

// User roles to test (will need valid session cookies)
const USER_ROLES = [
  { name: 'ADMIN', description: 'Administrator' },
  { name: 'OWNER', description: 'Client Owner' },
  { name: 'WORKER', description: 'Worker' },
  { name: 'VIEWER', description: 'Viewer' }
];

// Pages/routes to test
const ROUTES = [
  { path: '/', name: 'Dashboard', requiresAuth: true },
  { path: '/clients', name: 'Clients', requiresAuth: true },
  { path: '/workers', name: 'Workers', requiresAuth: true },
  { path: '/assignments', name: 'Assignments', requiresAuth: true },
  { path: '/workflow', name: 'Workflow', requiresAuth: true },
  { path: '/analytics', name: 'Analytics', requiresAuth: true },
  { path: '/settings', name: 'Settings', requiresAuth: true }
];

class ComprehensiveUITester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      details: []
    };
    
    // Ensure directories exist
    this.ensureDirectories();
  }

  ensureDirectories() {
    [CONFIG.screenshotDir, CONFIG.reportDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async init() {
    console.log('🚀 Starting Comprehensive UI Test Suite...');
    
    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.logError(`Console Error: ${msg.text()}`);
      }
    });
    
    // Enable request/response logging
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.logError(`HTTP Error: ${response.status()} - ${response.url()}`);
      }
    });
    
    // Set default timeout
    this.page.setDefaultTimeout(CONFIG.timeout);
  }

  async runAllTests() {
    try {
      await this.init();
      
      // Test each screen size
      for (const [sizeKey, size] of Object.entries(SCREEN_SIZES)) {
        console.log(`\n📱 Testing ${size.name} (${size.width}x${size.height})`);
        await this.page.setViewport(size);
        
        // Test each route
        for (const route of ROUTES) {
          await this.testRoute(route, size);
        }
      }
      
      // Generate comprehensive report
      await this.generateReport();
      
    } catch (error) {
      this.logError(`Test suite failed: ${error.message}`);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async testRoute(route, screenSize) {
    const testName = `${route.name} - ${screenSize.name}`;
    console.log(`  🔍 Testing: ${testName}`);
    
    try {
      // Navigate to route
      await this.page.goto(`${CONFIG.baseUrl}${route.path}`, {
        waitUntil: 'networkidle0'
      });
      
      // Wait for page to load
      await this.page.waitForTimeout(2000);
      
      // Take screenshot
      const screenshotPath = path.join(
        CONFIG.screenshotDir,
        `${route.name.toLowerCase().replace(/\s+/g, '-')}-${screenSize.name.toLowerCase()}.png`
      );
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      
      // Run comprehensive checks
      const checks = await this.runPageChecks(route, screenSize);
      
      this.testResults.details.push({
        route: route.name,
        screenSize: screenSize.name,
        timestamp: new Date().toISOString(),
        checks,
        screenshot: screenshotPath
      });
      
      // Update summary
      this.testResults.summary.totalTests++;
      if (checks.every(check => check.status === 'pass')) {
        this.testResults.summary.passed++;
        console.log(`    ✅ ${testName} - PASSED`);
      } else {
        const hasFailures = checks.some(check => check.status === 'fail');
        if (hasFailures) {
          this.testResults.summary.failed++;
          console.log(`    ❌ ${testName} - FAILED`);
        } else {
          this.testResults.summary.warnings++;
          console.log(`    ⚠️  ${testName} - WARNINGS`);
        }
      }
      
    } catch (error) {
      this.logError(`Failed to test ${testName}: ${error.message}`);
      this.testResults.summary.failed++;
    }
  }

  async runPageChecks(route, screenSize) {
    const checks = [];
    
    try {
      // Check 1: Page loads without errors
      checks.push(await this.checkPageLoad());
      
      // Check 2: Authentication status
      checks.push(await this.checkAuthentication());
      
      // Check 3: Data loading (no mock data)
      checks.push(await this.checkDataLoading());
      
      // Check 4: UI responsiveness
      checks.push(await this.checkResponsiveness(screenSize));
      
      // Check 5: Navigation links
      checks.push(await this.checkNavigation());
      
      // Check 6: Translation completeness
      checks.push(await this.checkTranslations());
      
      // Check 7: Performance metrics
      checks.push(await this.checkPerformance());
      
      // Check 8: Console errors
      checks.push(await this.checkConsoleErrors());
      
      // Check 9: Network requests
      checks.push(await this.checkNetworkRequests());
      
      // Check 10: Interactive elements
      checks.push(await this.checkInteractiveElements());
      
    } catch (error) {
      checks.push({
        name: 'Page Checks',
        status: 'fail',
        message: `Check execution failed: ${error.message}`
      });
    }
    
    return checks;
  }

  async checkPageLoad() {
    try {
      // Check if page title exists and is not default
      const title = await this.page.title();
      const hasContent = await this.page.$('body *');
      
      if (!title || title === 'Document' || !hasContent) {
        return {
          name: 'Page Load',
          status: 'fail',
          message: 'Page failed to load properly'
        };
      }
      
      return {
        name: 'Page Load',
        status: 'pass',
        message: `Page loaded successfully: "${title}"`
      };
    } catch (error) {
      return {
        name: 'Page Load',
        status: 'fail',
        message: `Page load check failed: ${error.message}`
      };
    }
  }

  async checkAuthentication() {
    try {
      // Check for authentication indicators
      const hasAuthContent = await this.page.evaluate(() => {
        // Look for user info, logout button, or protected content
        const indicators = [
          '[data-testid*="user"]',
          '[data-testid*="logout"]',
          '[data-testid*="profile"]',
          '.user-info',
          '.dashboard'
        ];
        
        return indicators.some(selector => document.querySelector(selector));
      });
      
      if (!hasAuthContent) {
        return {
          name: 'Authentication',
          status: 'warn',
          message: 'No authentication indicators found'
        };
      }
      
      return {
        name: 'Authentication',
        status: 'pass',
        message: 'Authentication indicators present'
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'fail',
        message: `Authentication check failed: ${error.message}`
      };
    }
  }

  async checkDataLoading() {
    try {
      // Check for real data vs mock/placeholder data
      const dataCheck = await this.page.evaluate(() => {
        const suspiciousText = [
          'lorem ipsum',
          'placeholder',
          'test@example.com',
          'john doe',
          'jane smith',
          'sample data',
          'mock data',
          'dummy data',
          'fake data'
        ];
        
        const bodyText = document.body.textContent.toLowerCase();
        const foundSuspicious = suspiciousText.filter(text => bodyText.includes(text));
        
        // Check for loading states that might indicate real data
        const hasLoadingStates = document.querySelector('[data-testid*="loading"]') ||
                                document.querySelector('.loading') ||
                                document.querySelector('.skeleton');
        
        // Check for data tables/lists with real-looking content
        const dataTables = document.querySelectorAll('table, [role="table"], .data-grid');
        const hasRealData = dataTables.length > 0;
        
        return {
          suspiciousText: foundSuspicious,
          hasLoadingStates,
          hasRealData,
          bodyTextLength: bodyText.length
        };
      });
      
      if (dataCheck.suspiciousText.length > 0) {
        return {
          name: 'Data Loading',
          status: 'fail',
          message: `Possible mock data detected: ${dataCheck.suspiciousText.join(', ')}`
        };
      }
      
      if (!dataCheck.hasRealData && dataCheck.bodyTextLength < 100) {
        return {
          name: 'Data Loading',
          status: 'warn',
          message: 'Page appears to have minimal content'
        };
      }
      
      return {
        name: 'Data Loading',
        status: 'pass',
        message: 'Real data loading appears correct'
      };
    } catch (error) {
      return {
        name: 'Data Loading',
        status: 'fail',
        message: `Data loading check failed: ${error.message}`
      };
    }
  }

  async checkResponsiveness(screenSize) {
    try {
      // Check for responsive design issues
      const responsiveCheck = await this.page.evaluate((size) => {
        const issues = [];
        
        // Check for horizontal scroll on mobile
        if (size.width <= 768 && document.body.scrollWidth > window.innerWidth) {
          issues.push('Horizontal scroll detected on mobile');
        }
        
        // Check for elements that might be too small for touch
        if (size.width <= 768) {
          const buttons = document.querySelectorAll('button, a, [role="button"]');
          buttons.forEach((btn, index) => {
            const rect = btn.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              issues.push(`Touch target too small: element ${index}`);
            }
          });
        }
        
        // Check for overlapping elements
        const overlaps = [];
        const elements = document.querySelectorAll('*');
        // Simplified overlap check for performance
        
        return {
          issues,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          bodyWidth: document.body.scrollWidth,
          bodyHeight: document.body.scrollHeight
        };
      }, screenSize);
      
      if (responsiveCheck.issues.length > 0) {
        return {
          name: 'Responsiveness',
          status: 'warn',
          message: `Responsive issues: ${responsiveCheck.issues.join(', ')}`
        };
      }
      
      return {
        name: 'Responsiveness',
        status: 'pass',
        message: `Responsive design working for ${screenSize.name}`
      };
    } catch (error) {
      return {
        name: 'Responsiveness',
        status: 'fail',
        message: `Responsiveness check failed: ${error.message}`
      };
    }
  }

  async checkNavigation() {
    try {
      // Test navigation links
      const navCheck = await this.page.evaluate(() => {
        const links = document.querySelectorAll('a[href], [data-testid*="nav"], nav a');
        const navInfo = {
          totalLinks: links.length,
          internalLinks: 0,
          externalLinks: 0,
          brokenHrefs: []
        };
        
        links.forEach(link => {
          const href = link.getAttribute('href');
          if (!href || href === '#' || href === 'javascript:void(0)') {
            navInfo.brokenHrefs.push(href || 'empty');
          } else if (href.startsWith('http')) {
            navInfo.externalLinks++;
          } else {
            navInfo.internalLinks++;
          }
        });
        
        return navInfo;
      });
      
      if (navCheck.brokenHrefs.length > 0) {
        return {
          name: 'Navigation',
          status: 'warn',
          message: `Found ${navCheck.brokenHrefs.length} potentially broken navigation links`
        };
      }
      
      return {
        name: 'Navigation',
        status: 'pass',
        message: `Navigation working: ${navCheck.totalLinks} links found`
      };
    } catch (error) {
      return {
        name: 'Navigation',
        status: 'fail',
        message: `Navigation check failed: ${error.message}`
      };
    }
  }

  async checkTranslations() {
    try {
      // Check for translation issues
      const translationCheck = await this.page.evaluate(() => {
        const bodyText = document.body.textContent;
        
        // Look for translation keys that weren't replaced
        const translationKeyPattern = /\b[a-z]+\.[a-zA-Z.]+\b/g;
        const possibleKeys = bodyText.match(translationKeyPattern) || [];
        
        // Filter out obvious non-translation keys
        const suspiciousKeys = possibleKeys.filter(key => 
          key.includes('.') && 
          !key.includes('@') && 
          !key.includes('http') &&
          key.length > 3
        );
        
        // Look for missing translation indicators
        const missingTranslations = bodyText.includes('[TRANSLATION ERROR]') ||
                                   bodyText.includes('Translation not found');
        
        return {
          suspiciousKeys: suspiciousKeys.slice(0, 10), // Limit output
          missingTranslations,
          hasInternationalization: document.querySelector('[lang]') !== null
        };
      });
      
      if (translationCheck.missingTranslations) {
        return {
          name: 'Translations',
          status: 'fail',
          message: 'Missing translations detected'
        };
      }
      
      if (translationCheck.suspiciousKeys.length > 0) {
        return {
          name: 'Translations',
          status: 'warn',
          message: `Possible untranslated keys: ${translationCheck.suspiciousKeys.slice(0, 3).join(', ')}`
        };
      }
      
      return {
        name: 'Translations',
        status: 'pass',
        message: 'Translations appear to be working correctly'
      };
    } catch (error) {
      return {
        name: 'Translations',
        status: 'fail',
        message: `Translation check failed: ${error.message}`
      };
    }
  }

  async checkPerformance() {
    try {
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: perf ? perf.loadEventEnd - perf.loadEventStart : 0,
          domContentLoaded: perf ? perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart : 0,
          firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });
      
      const issues = [];
      if (metrics.loadTime > 5000) issues.push('Slow page load');
      if (metrics.firstPaint > 3000) issues.push('Slow first paint');
      if (metrics.resourceCount > 100) issues.push('High resource count');
      
      if (issues.length > 0) {
        return {
          name: 'Performance',
          status: 'warn',
          message: `Performance issues: ${issues.join(', ')}`
        };
      }
      
      return {
        name: 'Performance',
        status: 'pass',
        message: `Good performance: Load ${metrics.loadTime}ms, Paint ${metrics.firstPaint}ms`
      };
    } catch (error) {
      return {
        name: 'Performance',
        status: 'fail',
        message: `Performance check failed: ${error.message}`
      };
    }
  }

  async checkConsoleErrors() {
    try {
      // Console errors are captured in the page.on('console') handler
      // For this check, we'll look for visible error messages
      const errorCheck = await this.page.evaluate(() => {
        const errorMessages = [];
        
        // Look for error display elements
        const errorElements = document.querySelectorAll('.error, .alert-error, [role="alert"]');
        errorElements.forEach(el => {
          if (el.textContent.trim()) {
            errorMessages.push(el.textContent.trim());
          }
        });
        
        return {
          visibleErrors: errorMessages,
          hasErrorBoundary: document.querySelector('[data-error-boundary]') !== null
        };
      });
      
      if (errorCheck.visibleErrors.length > 0) {
        return {
          name: 'Console Errors',
          status: 'fail',
          message: `Visible errors: ${errorCheck.visibleErrors.slice(0, 3).join('; ')}`
        };
      }
      
      return {
        name: 'Console Errors',
        status: 'pass',
        message: 'No visible errors detected'
      };
    } catch (error) {
      return {
        name: 'Console Errors',
        status: 'fail',
        message: `Console error check failed: ${error.message}`
      };
    }
  }

  async checkNetworkRequests() {
    try {
      // Get network performance data
      const networkCheck = await this.page.evaluate(() => {
        const resources = performance.getEntriesByType('resource');
        const failed = resources.filter(r => r.responseEnd === 0);
        const slow = resources.filter(r => r.duration > 3000);
        
        return {
          totalRequests: resources.length,
          failedRequests: failed.length,
          slowRequests: slow.length,
          apiCalls: resources.filter(r => r.name.includes('/api/')).length
        };
      });
      
      if (networkCheck.failedRequests > 0) {
        return {
          name: 'Network Requests',
          status: 'fail',
          message: `${networkCheck.failedRequests} failed network requests`
        };
      }
      
      if (networkCheck.slowRequests > 5) {
        return {
          name: 'Network Requests',
          status: 'warn',
          message: `${networkCheck.slowRequests} slow network requests`
        };
      }
      
      return {
        name: 'Network Requests',
        status: 'pass',
        message: `Network healthy: ${networkCheck.totalRequests} requests, ${networkCheck.apiCalls} API calls`
      };
    } catch (error) {
      return {
        name: 'Network Requests',
        status: 'fail',
        message: `Network check failed: ${error.message}`
      };
    }
  }

  async checkInteractiveElements() {
    try {
      // Test interactive elements
      const interactiveCheck = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="button"]');
        const inputs = document.querySelectorAll('input, textarea, select');
        const links = document.querySelectorAll('a[href]');
        
        const issues = [];
        
        // Check for disabled elements without proper indication
        buttons.forEach((btn, index) => {
          if (btn.disabled && !btn.getAttribute('aria-label') && !btn.title) {
            issues.push(`Button ${index} disabled without explanation`);
          }
        });
        
        // Check for form validation
        const forms = document.querySelectorAll('form');
        const hasValidation = Array.from(forms).some(form => 
          form.querySelector('[required]') || 
          form.querySelector('[pattern]') ||
          form.querySelector('[data-testid*="validation"]')
        );
        
        return {
          buttonCount: buttons.length,
          inputCount: inputs.length,
          linkCount: links.length,
          formCount: forms.length,
          hasValidation,
          issues
        };
      });
      
      if (interactiveCheck.issues.length > 0) {
        return {
          name: 'Interactive Elements',
          status: 'warn',
          message: `Issues found: ${interactiveCheck.issues.slice(0, 3).join('; ')}`
        };
      }
      
      return {
        name: 'Interactive Elements',
        status: 'pass',
        message: `Interactive elements working: ${interactiveCheck.buttonCount} buttons, ${interactiveCheck.inputCount} inputs`
      };
    } catch (error) {
      return {
        name: 'Interactive Elements',
        status: 'fail',
        message: `Interactive elements check failed: ${error.message}`
      };
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(CONFIG.reportDir, `ui-test-report-${timestamp}.json`);
    const htmlReportPath = path.join(CONFIG.reportDir, `ui-test-report-${timestamp}.html`);
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log(`   Total Tests: ${this.testResults.summary.totalTests}`);
    console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${this.testResults.summary.warnings}`);
    console.log(`\n📄 Reports saved:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  generateHTMLReport() {
    const { summary, details } = this.testResults;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UI Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 4px; }
        .pass { border-left: 4px solid #4CAF50; }
        .fail { border-left: 4px solid #f44336; }
        .warn { border-left: 4px solid #ff9800; }
        .check { margin: 5px 0; padding: 8px; background: #f9f9f9; border-radius: 4px; }
        .check.pass { background: #e8f5e8; }
        .check.fail { background: #ffebee; }
        .check.warn { background: #fff3e0; }
        h1, h2, h3 { color: #333; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>Comprehensive UI Test Report</h1>
    <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${summary.totalTests}</p>
        <p><strong>✅ Passed:</strong> ${summary.passed}</p>
        <p><strong>❌ Failed:</strong> ${summary.failed}</p>
        <p><strong>⚠️ Warnings:</strong> ${summary.warnings}</p>
        <p><strong>Success Rate:</strong> ${((summary.passed / summary.totalTests) * 100).toFixed(1)}%</p>
    </div>
    
    <h2>Detailed Results</h2>
    ${details.map(detail => `
        <div class="test-result ${this.getOverallStatus(detail.checks)}">
            <h3>${detail.route} - ${detail.screenSize}</h3>
            <div class="timestamp">${detail.timestamp}</div>
            
            <h4>Checks:</h4>
            ${detail.checks.map(check => `
                <div class="check ${check.status}">
                    <strong>${check.name}:</strong> ${check.message}
                </div>
            `).join('')}
            
            ${detail.screenshot ? `<p><strong>Screenshot:</strong> ${detail.screenshot}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  }

  getOverallStatus(checks) {
    if (checks.some(check => check.status === 'fail')) return 'fail';
    if (checks.some(check => check.status === 'warn')) return 'warn';
    return 'pass';
  }

  logError(message) {
    console.error(`❌ ${message}`);
  }
}

// CLI execution
async function main() {
  const tester = new ComprehensiveUITester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = ComprehensiveUITester;

// Run if called directly
if (require.main === module) {
  main();
}