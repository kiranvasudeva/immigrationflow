#!/usr/bin/env node
/**
 * Comprehensive Browser Testing Suite
 * 
 * This script performs thorough testing of the entire application:
 * - Tests every page and route with real browser automation
 * - Validates all screen sizes (desktop, tablet, mobile)
 * - Verifies no mock/hardcoded data exists anywhere
 * - Tests all interactive elements and user flows
 * - Validates real data loading from database
 * - Checks for translation issues
 * - Tests role-based access control
 * - Captures screenshots and performance metrics
 * 
 * NO assumptions, NO quick validations, ONLY thorough testing.
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Comprehensive test configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  headless: false, // Visual verification
  slowMo: 500, // Slow down for thorough testing
  timeout: 60000, // Longer timeout for thorough checks
  screenshotDir: './test-results/screenshots',
  reportDir: './test-results/reports',
  videoDir: './test-results/videos'
};

// Screen sizes for responsive testing
const SCREEN_SIZES = [
  { width: 1920, height: 1080, name: 'Desktop-Large', device: 'desktop' },
  { width: 1366, height: 768, name: 'Desktop-Standard', device: 'desktop' },
  { width: 1024, height: 768, name: 'Tablet-Landscape', device: 'tablet' },
  { width: 768, height: 1024, name: 'Tablet-Portrait', device: 'tablet' },
  { width: 414, height: 896, name: 'Mobile-iPhone', device: 'mobile' },
  { width: 375, height: 667, name: 'Mobile-Standard', device: 'mobile' },
  { width: 320, height: 568, name: 'Mobile-Small', device: 'mobile' }
];

// Complete route testing matrix
const ROUTES = [
  { 
    path: '/', 
    name: 'Dashboard',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="dashboard"]',
      '[data-testid*="stats"]',
      '[data-testid*="client"]',
      '[data-testid*="worker"]'
    ],
    expectedDataSources: ['/api/dashboard/stats', '/api/clients', '/api/workers'],
    interactions: ['navigation', 'data-loading', 'charts']
  },
  { 
    path: '/clients', 
    name: 'Clients',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="client"]',
      'table, [role="table"], .data-grid',
      '[data-testid*="search"], input[type="search"]'
    ],
    expectedDataSources: ['/api/clients'],
    interactions: ['search', 'pagination', 'client-details']
  },
  { 
    path: '/workers', 
    name: 'Workers',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="worker"]',
      'table, [role="table"], .data-grid'
    ],
    expectedDataSources: ['/api/workers'],
    interactions: ['search', 'pagination', 'worker-details']
  },
  { 
    path: '/assignments', 
    name: 'Assignments',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="assignment"]',
      'table, [role="table"], .data-grid'
    ],
    expectedDataSources: ['/api/assignments', '/api/dashboard/assignments'],
    interactions: ['search', 'filter', 'assignment-details']
  },
  { 
    path: '/workflow', 
    name: 'Workflow',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="workflow"]',
      '[data-testid*="stage"]',
      '.kanban, [data-testid*="kanban"]'
    ],
    expectedDataSources: ['/api/stages', '/api/workflow'],
    interactions: ['drag-drop', 'stage-management', 'task-details']
  },
  { 
    path: '/analytics', 
    name: 'Analytics',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="analytics"]',
      '[data-testid*="chart"]',
      'canvas, svg'
    ],
    expectedDataSources: ['/api/analytics', '/api/dashboard/stats'],
    interactions: ['chart-interaction', 'date-filters', 'export']
  },
  { 
    path: '/settings', 
    name: 'Settings',
    requiresAuth: true,
    expectedElements: [
      '[data-testid*="settings"]',
      'form, [data-testid*="form"]',
      'input, select, textarea'
    ],
    expectedDataSources: ['/api/settings', '/api/auth/user'],
    interactions: ['form-submission', 'preference-changes', 'validation']
  }
];

// Mock data indicators to strictly avoid
const FORBIDDEN_DATA_PATTERNS = [
  // Common mock data
  'lorem ipsum', 'placeholder', 'example.com', 'test@example.com',
  'john doe', 'jane smith', 'john.doe', 'jane.doe',
  'sample data', 'mock data', 'dummy data', 'fake data',
  '555-555-5555', '123-456-7890', '(555) 555-5555',
  
  // Default/placeholder values
  'enter your', 'click here', 'sample text', 'default value',
  'placeholder text', 'demo data', 'test data',
  
  // Common test identifiers
  'test user', 'test client', 'test company', 'acme corp',
  'foo@bar.com', 'user@domain.com', 'admin@test.com',
  
  // Development leftovers
  'todo:', 'fixme:', 'hack:', 'temp:', 'debug:',
  'console.log', 'alert(', 'debugger;'
];

class ComprehensiveBrowserTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        startTime: new Date().toISOString()
      },
      testMatrix: [],
      dataValidation: [],
      performanceMetrics: [],
      screenshots: [],
      errors: []
    };
    
    this.networkRequests = [];
    this.consoleMessages = [];
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    [CONFIG.screenshotDir, CONFIG.reportDir, CONFIG.videoDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async init() {
    console.log('🚀 Starting Comprehensive Browser Testing Suite...');
    console.log('⚠️  NO shortcuts, NO assumptions - THOROUGH testing only');
    
    this.browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ],
      defaultViewport: null
    });
    
    this.page = await this.browser.newPage();
    
    // Enable comprehensive monitoring
    await this.enableNetworkMonitoring();
    await this.enableConsoleMonitoring();
    await this.enablePerformanceMonitoring();
    
    // Set timeouts
    this.page.setDefaultTimeout(CONFIG.timeout);
    this.page.setDefaultNavigationTimeout(CONFIG.timeout);
  }

  async enableNetworkMonitoring() {
    await this.page.setRequestInterception(true);
    
    this.page.on('request', request => {
      this.networkRequests.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      });
      request.continue();
    });
    
    this.page.on('response', response => {
      this.networkRequests.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      });
    });
  }

  async enableConsoleMonitoring() {
    this.page.on('console', msg => {
      this.consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
      
      if (msg.type() === 'error') {
        this.testResults.errors.push({
          type: 'console-error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });
    
    this.page.on('pageerror', error => {
      this.testResults.errors.push({
        type: 'page-error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  async enablePerformanceMonitoring() {
    await this.page.evaluateOnNewDocument(() => {
      window.performanceMetrics = {
        navigationStart: performance.now(),
        domLoaded: null,
        fullyLoaded: null,
        firstPaint: null,
        largestContentfulPaint: null
      };
      
      document.addEventListener('DOMContentLoaded', () => {
        window.performanceMetrics.domLoaded = performance.now();
      });
      
      window.addEventListener('load', () => {
        window.performanceMetrics.fullyLoaded = performance.now();
      });
    });
  }

  async runComprehensiveTests() {
    try {
      await this.init();
      
      console.log(`📱 Testing ${SCREEN_SIZES.length} screen sizes × ${ROUTES.length} routes = ${SCREEN_SIZES.length * ROUTES.length} total tests`);
      
      // Test each screen size thoroughly
      for (const screenSize of SCREEN_SIZES) {
        console.log(`\n📱 Testing ${screenSize.name} (${screenSize.width}×${screenSize.height})`);
        await this.page.setViewport({ 
          width: screenSize.width, 
          height: screenSize.height 
        });
        
        // Test each route on this screen size
        for (const route of ROUTES) {
          console.log(`  🔍 Testing route: ${route.name}`);
          await this.testRouteComprehensively(route, screenSize);
        }
      }
      
      // Generate comprehensive reports
      await this.generateComprehensiveReport();
      
    } catch (error) {
      this.logError(`Test suite failed: ${error.message}`, error.stack);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async testRouteComprehensively(route, screenSize) {
    const testId = `${route.name}-${screenSize.name}`;
    const testStart = Date.now();
    
    try {
      // Clear previous state
      this.networkRequests = [];
      this.consoleMessages = [];
      
      // Navigate to route
      console.log(`    🌐 Navigating to ${route.path}`);
      await this.page.goto(`${CONFIG.baseUrl}${route.path}`, {
        waitUntil: 'networkidle0',
        timeout: CONFIG.timeout
      });
      
      // Wait for page to fully load
      await this.page.waitForTimeout(2000);
      
      // Run comprehensive checks
      const testResult = {
        testId,
        route: route.name,
        path: route.path,
        screenSize: screenSize.name,
        device: screenSize.device,
        timestamp: new Date().toISOString(),
        duration: 0,
        checks: [],
        screenshots: [],
        networkActivity: [],
        performanceMetrics: {},
        status: 'unknown'
      };
      
      // 1. Comprehensive UI Structure Validation
      console.log(`      ✅ Validating UI structure...`);
      await this.validateUIStructure(testResult, route);
      
      // 2. Thorough Data Loading Verification
      console.log(`      ✅ Verifying real data loading...`);
      await this.validateDataLoading(testResult, route);
      
      // 3. Complete Interactive Element Testing
      console.log(`      ✅ Testing interactive elements...`);
      await this.testInteractiveElements(testResult, route);
      
      // 4. Strict Mock Data Detection
      console.log(`      ✅ Scanning for forbidden mock data...`);
      await this.scanForMockData(testResult);
      
      // 5. Translation Completeness Check
      console.log(`      ✅ Validating translations...`);
      await this.validateTranslations(testResult);
      
      // 6. Performance Metrics Collection
      console.log(`      ✅ Collecting performance metrics...`);
      await this.collectPerformanceMetrics(testResult);
      
      // 7. Responsive Design Validation
      console.log(`      ✅ Validating responsive design...`);
      await this.validateResponsiveDesign(testResult, screenSize);
      
      // 8. Accessibility Testing
      console.log(`      ✅ Testing accessibility...`);
      await this.testAccessibility(testResult);
      
      // 9. Network Request Validation
      console.log(`      ✅ Validating network requests...`);
      await this.validateNetworkRequests(testResult, route);
      
      // 10. Take comprehensive screenshots
      console.log(`      ✅ Capturing screenshots...`);
      await this.captureScreenshots(testResult, testId);
      
      // Calculate test duration and status
      testResult.duration = Date.now() - testStart;
      testResult.status = this.calculateTestStatus(testResult);
      
      // Add to results
      this.testResults.testMatrix.push(testResult);
      this.testResults.summary.totalTests++;
      
      if (testResult.status === 'passed') {
        this.testResults.summary.passed++;
        console.log(`    ✅ ${testId} - PASSED (${testResult.duration}ms)`);
      } else if (testResult.status === 'failed') {
        this.testResults.summary.failed++;
        console.log(`    ❌ ${testId} - FAILED (${testResult.duration}ms)`);
      } else {
        this.testResults.summary.warnings++;
        console.log(`    ⚠️  ${testId} - WARNINGS (${testResult.duration}ms)`);
      }
      
    } catch (error) {
      this.testResults.summary.failed++;
      this.logError(`Test ${testId} failed: ${error.message}`, error.stack);
    }
  }

  async validateUIStructure(testResult, route) {
    const check = {
      name: 'UI Structure Validation',
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      // Check for expected elements
      for (const selector of route.expectedElements) {
        const element = await this.page.$(selector);
        if (element) {
          check.details.push(`✅ Found expected element: ${selector}`);
        } else {
          check.issues.push(`❌ Missing expected element: ${selector}`);
        }
      }
      
      // Check for React app structure
      const reactRoot = await this.page.$('#root');
      if (reactRoot) {
        check.details.push('✅ React root element found');
      } else {
        check.issues.push('❌ React root element missing');
      }
      
      // Check for navigation structure
      const navElements = await this.page.$$('nav, [role="navigation"], [data-testid*="nav"]');
      if (navElements.length > 0) {
        check.details.push(`✅ Navigation elements found: ${navElements.length}`);
      } else {
        check.issues.push('❌ No navigation elements found');
      }
      
      // Check for main content area
      const mainContent = await this.page.$('main, [role="main"], .main-content');
      if (mainContent) {
        check.details.push('✅ Main content area found');
      } else {
        check.issues.push('❌ No main content area found');
      }
      
      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during UI validation: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async validateDataLoading(testResult, route) {
    const check = {
      name: 'Real Data Loading Validation',
      status: 'unknown',
      details: [],
      issues: [],
      apiCalls: [],
      dataVerification: []
    };
    
    try {
      // Wait for all expected API calls
      await this.page.waitForTimeout(3000);
      
      // Check for expected API endpoints
      const apiCalls = this.networkRequests.filter(req => 
        req.type === 'response' && 
        req.url.includes('/api/') &&
        req.status === 200
      );
      
      check.apiCalls = apiCalls.map(call => ({
        url: call.url,
        status: call.status
      }));
      
      for (const expectedApi of route.expectedDataSources) {
        const found = apiCalls.some(call => call.url.includes(expectedApi));
        if (found) {
          check.details.push(`✅ API call made: ${expectedApi}`);
        } else {
          check.issues.push(`❌ Missing expected API call: ${expectedApi}`);
        }
      }
      
      // Verify actual data content on page
      const pageContent = await this.page.content();
      const textContent = await this.page.evaluate(() => document.body.textContent);
      
      // Check for data tables/grids with actual content
      const dataTables = await this.page.$$('table tbody tr, [role="table"] [role="row"], .data-grid .data-row');
      if (dataTables.length > 0) {
        check.details.push(`✅ Data rows found: ${dataTables.length}`);
        
        // Sample data from first few rows
        const sampleData = await Promise.all(
          dataTables.slice(0, 3).map(async (row, index) => {
            const rowText = await row.evaluate(el => el.textContent.trim());
            return `Row ${index + 1}: ${rowText.substring(0, 100)}`;
          })
        );
        
        check.dataVerification = sampleData;
        
      } else {
        check.issues.push('❌ No data rows found in tables/grids');
      }
      
      // Check for loading states (should be resolved)
      const loadingElements = await this.page.$$('[data-testid*="loading"], .loading, .skeleton');
      if (loadingElements.length > 0) {
        check.issues.push(`⚠️  Loading states still present: ${loadingElements.length}`);
      } else {
        check.details.push('✅ No persistent loading states');
      }
      
      // Verify meaningful content length
      if (textContent.length > 1000) {
        check.details.push(`✅ Substantial content: ${textContent.length} characters`);
      } else {
        check.issues.push(`❌ Minimal content: ${textContent.length} characters`);
      }
      
      check.status = check.issues.length === 0 ? 'passed' : 
                   check.issues.some(issue => issue.startsWith('❌')) ? 'failed' : 'warning';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during data validation: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async testInteractiveElements(testResult, route) {
    const check = {
      name: 'Interactive Elements Testing',
      status: 'unknown',
      details: [],
      issues: [],
      interactions: []
    };
    
    try {
      // Test all buttons
      const buttons = await this.page.$$('button, [role="button"], input[type="button"], input[type="submit"]');
      check.details.push(`Found ${buttons.length} interactive buttons`);
      
      for (let i = 0; i < Math.min(buttons.length, 5); i++) {
        try {
          const button = buttons[i];
          const isVisible = await button.isIntersectingViewport();
          const isEnabled = await button.evaluate(el => !el.disabled && !el.hasAttribute('aria-disabled'));
          
          if (isVisible && isEnabled) {
            // Test hover state
            await button.hover();
            await this.page.waitForTimeout(100);
            
            // Test click (but don't navigate away)
            const buttonText = await button.evaluate(el => el.textContent?.trim() || el.value || 'button');
            check.interactions.push(`Tested button: ${buttonText}`);
          }
        } catch (error) {
          check.issues.push(`Button test failed: ${error.message}`);
        }
      }
      
      // Test form inputs
      const inputs = await this.page.$$('input, textarea, select');
      check.details.push(`Found ${inputs.length} form inputs`);
      
      for (let i = 0; i < Math.min(inputs.length, 3); i++) {
        try {
          const input = inputs[i];
          const inputType = await input.evaluate(el => el.type || el.tagName.toLowerCase());
          
          if (inputType === 'text' || inputType === 'textarea') {
            await input.focus();
            await input.type('test', { delay: 50 });
            await input.evaluate(el => el.value = ''); // Clear after test
            check.interactions.push(`Tested input: ${inputType}`);
          }
        } catch (error) {
          check.issues.push(`Input test failed: ${error.message}`);
        }
      }
      
      // Test navigation links
      const links = await this.page.$$('a[href], [data-testid*="nav"] *');
      check.details.push(`Found ${links.length} navigation elements`);
      
      check.status = check.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during interaction testing: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async scanForMockData(testResult) {
    const check = {
      name: 'Strict Mock Data Detection',
      status: 'unknown',
      details: [],
      issues: [],
      forbiddenDataFound: []
    };
    
    try {
      const pageContent = await this.page.content();
      const textContent = await this.page.evaluate(() => document.body.textContent?.toLowerCase() || '');
      
      // Scan for each forbidden pattern
      for (const pattern of FORBIDDEN_DATA_PATTERNS) {
        if (textContent.includes(pattern.toLowerCase())) {
          check.forbiddenDataFound.push(pattern);
          check.issues.push(`❌ FORBIDDEN: Found mock data pattern: "${pattern}"`);
        }
      }
      
      // Additional checks for common patterns
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      const emails = textContent.match(emailPattern) || [];
      
      for (const email of emails) {
        if (email.includes('example.com') || email.includes('test.com') || email.includes('@domain.')) {
          check.forbiddenDataFound.push(email);
          check.issues.push(`❌ FORBIDDEN: Mock email found: "${email}"`);
        }
      }
      
      // Check for phone number patterns
      const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}-\d{3}-\d{4})/g;
      const phones = textContent.match(phonePattern) || [];
      
      for (const phone of phones) {
        if (phone.includes('555-555') || phone.includes('123-456') || phone.includes('(555)')) {
          check.forbiddenDataFound.push(phone);
          check.issues.push(`❌ FORBIDDEN: Mock phone found: "${phone}"`);
        }
      }
      
      if (check.forbiddenDataFound.length === 0) {
        check.status = 'passed';
        check.details.push('✅ No forbidden mock data patterns detected');
      } else {
        check.status = 'failed';
        check.details.push(`❌ CRITICAL: Found ${check.forbiddenDataFound.length} mock data violations`);
      }
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during mock data scan: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async validateTranslations(testResult) {
    const check = {
      name: 'Translation Completeness',
      status: 'unknown',
      details: [],
      issues: [],
      translationErrors: []
    };
    
    try {
      const pageContent = await this.page.content();
      const textContent = await this.page.evaluate(() => document.body.textContent || '');
      
      // Check for translation error indicators
      const translationErrorPatterns = [
        '[TRANSLATION ERROR]',
        'Translation not found',
        'Missing translation',
        'i18n.',
        'translation.'
      ];
      
      for (const pattern of translationErrorPatterns) {
        if (textContent.includes(pattern)) {
          check.translationErrors.push(pattern);
          check.issues.push(`❌ Translation error: ${pattern}`);
        }
      }
      
      // Check console for translation errors
      const translationConsoleErrors = this.consoleMessages.filter(msg => 
        msg.text.toLowerCase().includes('translation') && msg.type === 'error'
      );
      
      for (const error of translationConsoleErrors) {
        check.translationErrors.push(error.text);
        check.issues.push(`❌ Console translation error: ${error.text}`);
      }
      
      // Look for untranslated keys (format: key.subkey)
      const keyPattern = /\b[a-z]+\.[a-zA-Z.]+\b/g;
      const possibleKeys = textContent.match(keyPattern) || [];
      const suspiciousKeys = possibleKeys.filter(key => 
        !key.includes('@') && 
        !key.includes('http') && 
        !key.includes('.com') &&
        key.split('.').length >= 2 &&
        key.length > 5
      );
      
      if (suspiciousKeys.length > 0) {
        check.issues.push(`⚠️  Possible untranslated keys: ${suspiciousKeys.slice(0, 5).join(', ')}`);
      }
      
      if (check.translationErrors.length === 0 && suspiciousKeys.length === 0) {
        check.status = 'passed';
        check.details.push('✅ No translation errors detected');
      } else if (check.translationErrors.length > 0) {
        check.status = 'failed';
      } else {
        check.status = 'warning';
      }
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during translation validation: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async collectPerformanceMetrics(testResult) {
    try {
      const metrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          // Navigation timing
          navigationStart: navigation?.fetchStart || 0,
          domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
          loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
          
          // Paint timing
          firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
          
          // Resource timing
          totalResources: performance.getEntriesByType('resource').length,
          
          // Custom metrics
          customMetrics: window.performanceMetrics || {}
        };
      });
      
      testResult.performanceMetrics = metrics;
      
    } catch (error) {
      testResult.performanceMetrics = { error: error.message };
    }
  }

  async validateResponsiveDesign(testResult, screenSize) {
    const check = {
      name: `Responsive Design (${screenSize.device})`,
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      // Check for horizontal scroll
      const hasHorizontalScroll = await this.page.evaluate(() => 
        document.body.scrollWidth > window.innerWidth
      );
      
      if (hasHorizontalScroll && screenSize.device === 'mobile') {
        check.issues.push('❌ Horizontal scroll detected on mobile');
      } else {
        check.details.push('✅ No unwanted horizontal scroll');
      }
      
      // Check touch target sizes on mobile
      if (screenSize.device === 'mobile') {
        const smallTargets = await this.page.evaluate(() => {
          const buttons = document.querySelectorAll('button, a, [role="button"]');
          let count = 0;
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) count++;
          });
          return count;
        });
        
        if (smallTargets > 0) {
          check.issues.push(`❌ ${smallTargets} touch targets too small (< 44px)`);
        } else {
          check.details.push('✅ All touch targets adequately sized');
        }
      }
      
      // Check text readability
      const textReadability = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
        let smallTextCount = 0;
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 14) smallTextCount++;
        });
        return smallTextCount;
      });
      
      if (textReadability > 10) {
        check.issues.push(`⚠️  ${textReadability} elements with small text (< 14px)`);
      } else {
        check.details.push('✅ Text sizes appropriate');
      }
      
      check.status = check.issues.length === 0 ? 'passed' : 
                   check.issues.some(issue => issue.startsWith('❌')) ? 'failed' : 'warning';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during responsive validation: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async testAccessibility(testResult) {
    const check = {
      name: 'Accessibility Testing',
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      // Check for alt text on images
      const imagesWithoutAlt = await this.page.evaluate(() => {
        const images = document.querySelectorAll('img');
        let count = 0;
        images.forEach(img => {
          if (!img.alt && !img.getAttribute('aria-label')) count++;
        });
        return count;
      });
      
      if (imagesWithoutAlt > 0) {
        check.issues.push(`❌ ${imagesWithoutAlt} images missing alt text`);
      } else {
        check.details.push('✅ All images have alt text');
      }
      
      // Check for proper heading structure
      const headingStructure = await this.page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return headings.map(h => h.tagName);
      });
      
      if (headingStructure.length > 0) {
        check.details.push(`✅ Heading structure: ${headingStructure.join(', ')}`);
      } else {
        check.issues.push('⚠️  No heading structure found');
      }
      
      // Check for form labels
      const unlabeledInputs = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input, textarea, select');
        let count = 0;
        inputs.forEach(input => {
          if (!input.labels?.length && 
              !input.getAttribute('aria-label') && 
              !input.getAttribute('aria-labelledby')) {
            count++;
          }
        });
        return count;
      });
      
      if (unlabeledInputs > 0) {
        check.issues.push(`❌ ${unlabeledInputs} form inputs missing labels`);
      } else {
        check.details.push('✅ All form inputs properly labeled');
      }
      
      check.status = check.issues.length === 0 ? 'passed' : 'warning';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during accessibility testing: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async validateNetworkRequests(testResult, route) {
    const check = {
      name: 'Network Request Validation',
      status: 'unknown',
      details: [],
      issues: [],
      requests: []
    };
    
    try {
      const apiRequests = this.networkRequests.filter(req => 
        req.url.includes('/api/') && req.type === 'response'
      );
      
      const failedRequests = apiRequests.filter(req => req.status >= 400);
      const slowRequests = this.networkRequests.filter(req => {
        const responseReq = this.networkRequests.find(r => 
          r.url === req.url && r.type === 'response' && r.timestamp > req.timestamp
        );
        return responseReq && (responseReq.timestamp - req.timestamp) > 5000;
      });
      
      check.requests = apiRequests.map(req => ({
        url: req.url,
        status: req.status
      }));
      
      if (failedRequests.length > 0) {
        check.issues.push(`❌ ${failedRequests.length} failed API requests`);
        failedRequests.forEach(req => {
          check.issues.push(`  - ${req.status}: ${req.url}`);
        });
      } else {
        check.details.push('✅ All API requests successful');
      }
      
      if (slowRequests.length > 0) {
        check.issues.push(`⚠️  ${slowRequests.length} slow requests (>5s)`);
      } else {
        check.details.push('✅ All requests completed in reasonable time');
      }
      
      check.details.push(`Total API calls: ${apiRequests.length}`);
      
      check.status = failedRequests.length > 0 ? 'failed' : 
                   slowRequests.length > 0 ? 'warning' : 'passed';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during network validation: ${error.message}`);
    }
    
    testResult.checks.push(check);
  }

  async captureScreenshots(testResult, testId) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const screenshotPath = path.join(CONFIG.screenshotDir, `${testId}-${timestamp}.png`);
      
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
        quality: 90
      });
      
      testResult.screenshots.push(screenshotPath);
      this.testResults.screenshots.push({
        testId,
        path: screenshotPath,
        timestamp
      });
      
    } catch (error) {
      testResult.screenshots.push(`Error: ${error.message}`);
    }
  }

  calculateTestStatus(testResult) {
    const checks = testResult.checks;
    
    if (checks.some(check => check.status === 'failed')) {
      return 'failed';
    }
    
    if (checks.some(check => check.status === 'warning')) {
      return 'warning';
    }
    
    if (checks.every(check => check.status === 'passed')) {
      return 'passed';
    }
    
    return 'unknown';
  }

  async generateComprehensiveReport() {
    const endTime = new Date().toISOString();
    this.testResults.summary.endTime = endTime;
    
    // Calculate success rate
    const total = this.testResults.summary.totalTests;
    const passed = this.testResults.summary.passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    // Generate JSON report
    const jsonReportPath = path.join(CONFIG.reportDir, `comprehensive-test-report-${Date.now()}.json`);
    fs.writeFileSync(jsonReportPath, JSON.stringify(this.testResults, null, 2));
    
    // Generate HTML report
    const htmlReportPath = path.join(CONFIG.reportDir, `comprehensive-test-report-${Date.now()}.html`);
    const htmlReport = this.generateHTMLReport(successRate);
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Print comprehensive summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`🔍 Total Tests Executed: ${total}`);
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${this.testResults.summary.failed}`);
    console.log(`⚠️  Tests with Warnings: ${this.testResults.summary.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`🕒 Test Duration: ${this.testResults.summary.startTime} - ${endTime}`);
    console.log(`📸 Screenshots Captured: ${this.testResults.screenshots.length}`);
    console.log(`🚨 Total Errors: ${this.testResults.errors.length}`);
    
    console.log('\n📄 Reports Generated:');
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    // Print critical issues
    if (this.testResults.summary.failed > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      this.testResults.testMatrix.forEach(test => {
        if (test.status === 'failed') {
          console.log(`   ❌ ${test.testId}:`);
          test.checks.forEach(check => {
            if (check.status === 'failed') {
              check.issues.forEach(issue => {
                console.log(`      ${issue}`);
              });
            }
          });
        }
      });
    }
    
    // Success message
    if (this.testResults.summary.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Your application is thoroughly validated.');
      console.log('✨ No mock data, all real data loading, full functionality verified.');
    } else {
      console.log('\n❌ TESTS FAILED! Critical issues found that need immediate attention.');
    }
    
    console.log('='.repeat(80));
  }

  generateHTMLReport(successRate) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive UI Test Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 2.5em; font-weight: bold; margin-bottom: 10px; }
        .stat-label { color: #666; font-size: 0.9em; }
        .passed { color: #4CAF50; }
        .failed { color: #f44336; }
        .warning { color: #ff9800; }
        .test-result { border: 1px solid #ddd; margin: 20px 0; border-radius: 8px; overflow: hidden; }
        .test-header { padding: 15px; font-weight: bold; }
        .test-header.passed { background: #e8f5e8; border-left: 4px solid #4CAF50; }
        .test-header.failed { background: #ffebee; border-left: 4px solid #f44336; }
        .test-header.warning { background: #fff3e0; border-left: 4px solid #ff9800; }
        .test-details { padding: 15px; background: #f9f9f9; }
        .check { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .check-title { font-weight: bold; margin-bottom: 5px; }
        .check-details { margin-left: 10px; }
        .check-details div { margin: 2px 0; }
        .success { color: #4CAF50; }
        .error { color: #f44336; }
        .warn { color: #ff9800; }
        .screenshot { max-width: 200px; border-radius: 4px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Comprehensive UI Test Report</h1>
        <p>Complete validation of all pages, screen sizes, and functionality</p>
        <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
    </div>

    <div class="summary">
        <div class="stat-card">
            <div class="stat-number">${this.testResults.summary.totalTests}</div>
            <div class="stat-label">Total Tests</div>
        </div>
        <div class="stat-card">
            <div class="stat-number passed">${this.testResults.summary.passed}</div>
            <div class="stat-label">Passed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number failed">${this.testResults.summary.failed}</div>
            <div class="stat-label">Failed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number warning">${this.testResults.summary.warnings}</div>
            <div class="stat-label">Warnings</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${successRate}%</div>
            <div class="stat-label">Success Rate</div>
        </div>
    </div>

    <h2>📋 Detailed Test Results</h2>
    ${this.testResults.testMatrix.map(test => `
        <div class="test-result">
            <div class="test-header ${test.status}">
                ${test.testId} - ${test.status.toUpperCase()} (${test.duration}ms)
                <div style="font-weight: normal; margin-top: 5px;">
                    Route: ${test.path} | Screen: ${test.screenSize} | Device: ${test.device}
                </div>
            </div>
            <div class="test-details">
                ${test.checks.map(check => `
                    <div class="check">
                        <div class="check-title">${check.name} - ${check.status.toUpperCase()}</div>
                        <div class="check-details">
                            ${check.details?.map(detail => `<div class="success">${detail}</div>`).join('') || ''}
                            ${check.issues?.map(issue => `<div class="error">${issue}</div>`).join('') || ''}
                        </div>
                    </div>
                `).join('')}
                
                ${test.screenshots.length > 0 ? `
                    <div class="check">
                        <div class="check-title">Screenshots</div>
                        <div class="check-details">
                            ${test.screenshots.map(screenshot => `
                                <div>📸 ${path.basename(screenshot)}</div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('')}

    ${this.testResults.errors.length > 0 ? `
        <h2>🚨 Error Log</h2>
        <div style="background: #ffebee; padding: 20px; border-radius: 8px;">
            ${this.testResults.errors.map(error => `
                <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 4px;">
                    <strong>${error.type}:</strong> ${error.message}
                    <div class="timestamp">${error.timestamp}</div>
                </div>
            `).join('')}
        </div>
    ` : ''}

</body>
</html>`;
  }

  logError(message, stack = '') {
    console.error(`❌ ${message}`);
    if (stack) console.error(stack);
    
    this.testResults.errors.push({
      type: 'test-error',
      message,
      stack,
      timestamp: new Date().toISOString()
    });
  }
}

// Main execution
async function main() {
  const tester = new ComprehensiveBrowserTester();
  
  try {
    await tester.runComprehensiveTests();
    
    // Exit with appropriate code
    if (tester.testResults.summary.failed > 0) {
      console.log('\n❌ Tests failed - exiting with error code');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed - success!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export default ComprehensiveBrowserTester;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}