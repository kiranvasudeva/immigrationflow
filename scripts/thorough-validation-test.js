#!/usr/bin/env node
/**
 * Thorough Application Validation Suite
 * 
 * This script performs comprehensive validation without browser dependencies:
 * - Tests all endpoints and routes with real HTTP requests
 * - Validates HTML structure and content
 * - Verifies no mock/hardcoded data exists
 * - Tests data loading and API responses
 * - Validates translations and internationalization
 * - Checks responsive design HTML structure
 * - Tests accessibility features
 * - Validates performance and response times
 * 
 * THOROUGH testing with NO assumptions or shortcuts.
 */

import fs from 'fs';
import path from 'path';
import { JSDOM } from 'jsdom';

// Comprehensive test configuration
const CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 30000,
  reportDir: './test-results/reports',
  maxRetries: 3
};

// All routes to test thoroughly
const ROUTES = [
  { 
    path: '/', 
    name: 'Dashboard',
    expectedElements: ['dashboard', 'stats', 'client', 'worker'],
    expectedAPIs: ['/api/dashboard/stats', '/api/clients', '/api/workers'],
    contentChecks: ['immigration', 'workflow', 'management']
  },
  { 
    path: '/clients', 
    name: 'Clients',
    expectedElements: ['client', 'table', 'search'],
    expectedAPIs: ['/api/clients'],
    contentChecks: ['client', 'company', 'contact']
  },
  { 
    path: '/workers', 
    name: 'Workers',
    expectedElements: ['worker', 'table', 'data'],
    expectedAPIs: ['/api/workers'],
    contentChecks: ['worker', 'name', 'nationality']
  },
  { 
    path: '/assignments', 
    name: 'Assignments',
    expectedElements: ['assignment', 'table', 'status'],
    expectedAPIs: ['/api/assignments'],
    contentChecks: ['assignment', 'status', 'stage']
  },
  { 
    path: '/workflow', 
    name: 'Workflow',
    expectedElements: ['workflow', 'stage', 'kanban'],
    expectedAPIs: ['/api/stages', '/api/workflow'],
    contentChecks: ['workflow', 'stage', 'process']
  },
  { 
    path: '/analytics', 
    name: 'Analytics',
    expectedElements: ['analytics', 'chart', 'metric'],
    expectedAPIs: ['/api/analytics'],
    contentChecks: ['analytics', 'chart', 'metric']
  },
  { 
    path: '/settings', 
    name: 'Settings',
    expectedElements: ['settings', 'form', 'input'],
    expectedAPIs: ['/api/settings'],
    contentChecks: ['settings', 'preference', 'configuration']
  }
];

// API endpoints to validate thoroughly
const API_ENDPOINTS = [
  { path: '/api/clients', method: 'GET', expectedFields: ['id', 'name', 'email'] },
  { path: '/api/workers', method: 'GET', expectedFields: ['id', 'name', 'nationality'] },
  { path: '/api/assignments', method: 'GET', expectedFields: ['id', 'clientId', 'workerId', 'stageId'] },
  { path: '/api/stages', method: 'GET', expectedFields: ['id', 'name', 'order'] },
  { path: '/api/dashboard/stats', method: 'GET', expectedFields: ['totalClients', 'totalWorkers'] },
  { path: '/api/dashboard/assignments', method: 'GET', expectedFields: [] },
  { path: '/api/workflow', method: 'GET', expectedFields: [] },
  { path: '/api/analytics', method: 'GET', expectedFields: [] },
  { path: '/api/settings', method: 'GET', expectedFields: [] },
  { path: '/health', method: 'GET', expectedFields: ['status'] }
];

// Strict forbidden data patterns
const FORBIDDEN_PATTERNS = [
  // Mock data patterns
  'lorem ipsum', 'placeholder', 'example.com', 'test@example.com',
  'john doe', 'jane smith', 'john.doe', 'jane.doe', 'sample data',
  'mock data', 'dummy data', 'fake data', 'test data', 'demo data',
  
  // Common test values
  '555-555-5555', '123-456-7890', '(555) 555-5555',
  'acme corp', 'test company', 'sample company',
  'foo@bar.com', 'user@domain.com', 'admin@test.com',
  
  // Development artifacts
  'todo:', 'fixme:', 'hack:', 'temp:', 'debug:',
  'console.log', 'alert(', 'debugger;',
  '[object object]', 'undefined', 'null',
  
  // Translation errors
  '[translation error]', 'translation not found', 'missing translation',
  'i18n.', 'translation.', '{{', '}}'
];

class ThoroughValidationSuite {
  constructor() {
    this.results = {
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        startTime: new Date().toISOString()
      },
      routeTests: [],
      apiTests: [],
      dataValidation: [],
      performanceMetrics: [],
      errors: []
    };
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }
  }

  async runThoroughValidation() {
    console.log('🔍 Starting Thorough Application Validation Suite...');
    console.log('⚠️  COMPREHENSIVE testing - NO shortcuts, NO assumptions');
    console.log(`📍 Base URL: ${CONFIG.baseUrl}`);
    console.log(`📄 Routes to test: ${ROUTES.length}`);
    console.log(`🔌 API endpoints to test: ${API_ENDPOINTS.length}`);
    
    try {
      // 1. Server Health Check
      console.log('\n🏥 Checking server health...');
      await this.checkServerHealth();
      
      // 2. Comprehensive Route Testing
      console.log('\n🌐 Testing all routes thoroughly...');
      await this.testAllRoutes();
      
      // 3. Comprehensive API Testing
      console.log('\n🔌 Testing all API endpoints...');
      await this.testAllAPIs();
      
      // 4. Data Integrity Validation
      console.log('\n📊 Validating data integrity...');
      await this.validateDataIntegrity();
      
      // 5. Performance Analysis
      console.log('\n⚡ Analyzing performance metrics...');
      await this.analyzePerformance();
      
      // 6. Generate comprehensive report
      await this.generateReport();
      
      return this.results;
      
    } catch (error) {
      this.logError(`Validation suite failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkServerHealth() {
    const test = {
      name: 'Server Health Check',
      status: 'unknown',
      details: [],
      issues: [],
      timestamp: new Date().toISOString()
    };
    
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/health', 'GET');
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        test.status = 'passed';
        test.details.push(`✅ Server responding (${response.status})`);
        test.details.push(`✅ Response time: ${duration}ms`);
        test.details.push(`✅ Health status: ${data.status || 'ok'}`);
        this.results.summary.passed++;
      } else {
        test.status = 'failed';
        test.issues.push(`❌ Server returned ${response.status}`);
        this.results.summary.failed++;
      }
      
    } catch (error) {
      test.status = 'failed';
      test.issues.push(`❌ Server unreachable: ${error.message}`);
      this.results.summary.failed++;
    }
    
    this.results.summary.totalTests++;
    this.results.routeTests.push(test);
    
    if (test.status === 'failed') {
      throw new Error('Server health check failed - cannot continue testing');
    }
    
    console.log(`    ✅ Server is healthy and responding`);
  }

  async testAllRoutes() {
    for (const route of ROUTES) {
      console.log(`  🔍 Testing route: ${route.name} (${route.path})`);
      await this.testRouteThoroughly(route);
    }
  }

  async testRouteThoroughly(route) {
    const test = {
      name: `Route: ${route.name}`,
      path: route.path,
      status: 'unknown',
      details: [],
      issues: [],
      checks: [],
      timestamp: new Date().toISOString(),
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      // 1. HTTP Response Check
      const httpCheck = await this.checkHTTPResponse(route);
      test.checks.push(httpCheck);
      
      if (httpCheck.status !== 'passed') {
        test.status = 'failed';
        test.issues.push(`HTTP request failed`);
        this.results.summary.failed++;
        this.results.routeTests.push(test);
        return;
      }
      
      // Get page content for analysis
      const response = await this.makeRequest(route.path, 'GET');
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // 2. HTML Structure Validation
      console.log(`    ✅ Validating HTML structure...`);
      const structureCheck = await this.validateHTMLStructure(html, document, route);
      test.checks.push(structureCheck);
      
      // 3. Content Analysis
      console.log(`    ✅ Analyzing page content...`);
      const contentCheck = await this.analyzePageContent(html, document, route);
      test.checks.push(contentCheck);
      
      // 4. Mock Data Detection
      console.log(`    ✅ Scanning for forbidden mock data...`);
      const mockDataCheck = await this.scanForMockData(html, document);
      test.checks.push(mockDataCheck);
      
      // 5. Translation Validation
      console.log(`    ✅ Validating translations...`);
      const translationCheck = await this.validateTranslations(html, document);
      test.checks.push(translationCheck);
      
      // 6. Accessibility Check
      console.log(`    ✅ Checking accessibility...`);
      const accessibilityCheck = await this.checkAccessibility(html, document);
      test.checks.push(accessibilityCheck);
      
      // 7. Responsive Design Structure
      console.log(`    ✅ Validating responsive design...`);
      const responsiveCheck = await this.checkResponsiveStructure(html, document);
      test.checks.push(responsiveCheck);
      
      // Calculate test status
      test.duration = Date.now() - startTime;
      test.status = this.calculateTestStatus(test.checks);
      
      // Update summary
      if (test.status === 'passed') {
        this.results.summary.passed++;
        console.log(`    ✅ ${route.name} - PASSED (${test.duration}ms)`);
      } else if (test.status === 'failed') {
        this.results.summary.failed++;
        console.log(`    ❌ ${route.name} - FAILED (${test.duration}ms)`);
      } else {
        this.results.summary.warnings++;
        console.log(`    ⚠️  ${route.name} - WARNINGS (${test.duration}ms)`);
      }
      
    } catch (error) {
      test.status = 'failed';
      test.duration = Date.now() - startTime;
      test.issues.push(`Test failed: ${error.message}`);
      this.results.summary.failed++;
      console.log(`    ❌ ${route.name} - ERROR: ${error.message}`);
    }
    
    this.results.summary.totalTests++;
    this.results.routeTests.push(test);
  }

  async checkHTTPResponse(route) {
    const check = {
      name: 'HTTP Response',
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      const response = await this.makeRequest(route.path, 'GET');
      
      if (response.ok) {
        check.status = 'passed';
        check.details.push(`✅ HTTP ${response.status} ${response.statusText}`);
        check.details.push(`✅ Content-Type: ${response.headers.get('content-type')}`);
      } else {
        check.status = 'failed';
        check.issues.push(`❌ HTTP ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`❌ Request failed: ${error.message}`);
    }
    
    return check;
  }

  async validateHTMLStructure(html, document, route) {
    const check = {
      name: 'HTML Structure',
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      // Check DOCTYPE
      if (html.includes('<!DOCTYPE html>')) {
        check.details.push('✅ Valid HTML5 DOCTYPE');
      } else {
        check.issues.push('❌ Missing HTML5 DOCTYPE');
      }
      
      // Check essential elements
      const head = document.querySelector('head');
      const body = document.querySelector('body');
      const title = document.querySelector('title');
      
      if (head) check.details.push('✅ Head element present');
      else check.issues.push('❌ Missing head element');
      
      if (body) check.details.push('✅ Body element present');
      else check.issues.push('❌ Missing body element');
      
      if (title && title.textContent.trim()) {
        check.details.push(`✅ Title: ${title.textContent.trim()}`);
      } else {
        check.issues.push('❌ Missing or empty title');
      }
      
      // Check React root
      const reactRoot = document.querySelector('#root');
      if (reactRoot) {
        check.details.push('✅ React root element found');
      } else {
        check.issues.push('❌ React root element missing');
      }
      
      // Check for expected elements
      for (const expectedElement of route.expectedElements) {
        const elements = document.querySelectorAll(`[data-testid*="${expectedElement}"], .${expectedElement}, #${expectedElement}`);
        if (elements.length > 0) {
          check.details.push(`✅ Found elements for: ${expectedElement} (${elements.length})`);
        } else {
          check.issues.push(`❌ Missing expected elements: ${expectedElement}`);
        }
      }
      
      // Check navigation structure
      const navElements = document.querySelectorAll('nav, [role="navigation"], [data-testid*="nav"]');
      if (navElements.length > 0) {
        check.details.push(`✅ Navigation structure found (${navElements.length} elements)`);
      } else {
        check.issues.push('❌ No navigation structure found');
      }
      
      check.status = check.issues.length === 0 ? 'passed' : 'failed';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during HTML validation: ${error.message}`);
    }
    
    return check;
  }

  async analyzePageContent(html, document, route) {
    const check = {
      name: 'Content Analysis',
      status: 'unknown',
      details: [],
      issues: [],
      contentMetrics: {}
    };
    
    try {
      const textContent = document.body.textContent || '';
      const contentLength = textContent.length;
      
      // Content length validation
      if (contentLength > 2000) {
        check.details.push(`✅ Substantial content: ${contentLength} characters`);
        check.contentMetrics.contentLength = contentLength;
      } else if (contentLength > 500) {
        check.issues.push(`⚠️  Minimal content: ${contentLength} characters`);
        check.contentMetrics.contentLength = contentLength;
      } else {
        check.issues.push(`❌ Very little content: ${contentLength} characters`);
        check.contentMetrics.contentLength = contentLength;
      }
      
      // Expected content checks
      const foundContent = [];
      const missingContent = [];
      
      for (const expectedContent of route.contentChecks) {
        if (textContent.toLowerCase().includes(expectedContent.toLowerCase())) {
          foundContent.push(expectedContent);
        } else {
          missingContent.push(expectedContent);
        }
      }
      
      if (foundContent.length > 0) {
        check.details.push(`✅ Found expected content: ${foundContent.join(', ')}`);
      }
      
      if (missingContent.length > 0) {
        check.issues.push(`⚠️  Missing expected content: ${missingContent.join(', ')}`);
      }
      
      // Data structure analysis
      const tables = document.querySelectorAll('table, [role="table"]');
      const forms = document.querySelectorAll('form');
      const buttons = document.querySelectorAll('button, [role="button"]');
      const inputs = document.querySelectorAll('input, textarea, select');
      
      check.contentMetrics.tables = tables.length;
      check.contentMetrics.forms = forms.length;
      check.contentMetrics.buttons = buttons.length;
      check.contentMetrics.inputs = inputs.length;
      
      if (tables.length > 0) {
        check.details.push(`✅ Data tables found: ${tables.length}`);
        
        // Sample table data
        const firstTable = tables[0];
        const rows = firstTable.querySelectorAll('tr');
        if (rows.length > 1) {
          check.details.push(`✅ Table has ${rows.length} rows`);
          
          // Check for actual data in first few rows
          const sampleRows = Array.from(rows).slice(1, 4); // Skip header
          const sampleData = sampleRows.map(row => row.textContent.trim().substring(0, 100));
          if (sampleData.some(data => data.length > 10)) {
            check.details.push(`✅ Table contains meaningful data`);
          } else {
            check.issues.push(`⚠️  Table appears to have minimal data`);
          }
        }
      }
      
      if (forms.length > 0) {
        check.details.push(`✅ Forms found: ${forms.length}`);
      }
      
      if (buttons.length > 0) {
        check.details.push(`✅ Interactive buttons: ${buttons.length}`);
      }
      
      if (inputs.length > 0) {
        check.details.push(`✅ Form inputs: ${inputs.length}`);
      }
      
      check.status = check.issues.some(issue => issue.startsWith('❌')) ? 'failed' : 
                   check.issues.length > 0 ? 'warning' : 'passed';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during content analysis: ${error.message}`);
    }
    
    return check;
  }

  async scanForMockData(html, document) {
    const check = {
      name: 'Mock Data Detection',
      status: 'unknown',
      details: [],
      issues: [],
      forbiddenFound: []
    };
    
    try {
      const textContent = (document.body.textContent || '').toLowerCase();
      const htmlContent = html.toLowerCase();
      
      // Scan for forbidden patterns
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (textContent.includes(pattern.toLowerCase()) || htmlContent.includes(pattern.toLowerCase())) {
          check.forbiddenFound.push(pattern);
          check.issues.push(`❌ FORBIDDEN MOCK DATA: "${pattern}"`);
        }
      }
      
      // Email pattern check
      const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
      const emails = textContent.match(emailPattern) || [];
      
      for (const email of emails) {
        if (email.includes('example.com') || email.includes('test.com') || 
            email.includes('@domain.') || email.includes('foo@') || 
            email.includes('@bar.')) {
          check.forbiddenFound.push(email);
          check.issues.push(`❌ FORBIDDEN MOCK EMAIL: "${email}"`);
        }
      }
      
      // Phone pattern check
      const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}-\d{3}-\d{4})/g;
      const phones = textContent.match(phonePattern) || [];
      
      for (const phone of phones) {
        if (phone.includes('555-555') || phone.includes('123-456') || phone.includes('(555)')) {
          check.forbiddenFound.push(phone);
          check.issues.push(`❌ FORBIDDEN MOCK PHONE: "${phone}"`);
        }
      }
      
      // Check for obvious placeholder text
      const placeholderPatterns = [
        'click here', 'enter your', 'your name here', 'your email here',
        'sample text', 'placeholder text', 'default value'
      ];
      
      for (const placeholder of placeholderPatterns) {
        if (textContent.includes(placeholder)) {
          check.forbiddenFound.push(placeholder);
          check.issues.push(`❌ FORBIDDEN PLACEHOLDER: "${placeholder}"`);
        }
      }
      
      if (check.forbiddenFound.length === 0) {
        check.status = 'passed';
        check.details.push('✅ NO MOCK DATA FOUND - All content appears to be real');
        check.details.push(`✅ Scanned ${FORBIDDEN_PATTERNS.length} forbidden patterns`);
        check.details.push(`✅ Content length: ${textContent.length} characters`);
      } else {
        check.status = 'failed';
        check.details.push(`❌ CRITICAL: ${check.forbiddenFound.length} mock data violations found`);
      }
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during mock data scan: ${error.message}`);
    }
    
    return check;
  }

  async validateTranslations(html, document) {
    const check = {
      name: 'Translation Validation',
      status: 'unknown',
      details: [],
      issues: [],
      translationErrors: []
    };
    
    try {
      const textContent = document.body.textContent || '';
      const htmlContent = html;
      
      // Check for translation error indicators
      const errorPatterns = [
        '[translation error]', 'translation not found', 'missing translation',
        'i18n.', 'translation.', '{{', '}}', 't(', 'translate('
      ];
      
      for (const pattern of errorPatterns) {
        if (textContent.toLowerCase().includes(pattern.toLowerCase()) || 
            htmlContent.toLowerCase().includes(pattern.toLowerCase())) {
          check.translationErrors.push(pattern);
          check.issues.push(`❌ Translation error indicator: ${pattern}`);
        }
      }
      
      // Look for untranslated keys (format: key.subkey)
      const keyPattern = /\b[a-z]+\.[a-zA-Z.]+\b/g;
      const possibleKeys = textContent.match(keyPattern) || [];
      const suspiciousKeys = possibleKeys.filter(key => 
        !key.includes('@') && 
        !key.includes('http') && 
        !key.includes('.com') &&
        !key.includes('.js') &&
        !key.includes('.css') &&
        key.split('.').length >= 2 &&
        key.length > 5
      );
      
      if (suspiciousKeys.length > 0) {
        const uniqueKeys = [...new Set(suspiciousKeys)].slice(0, 5);
        check.issues.push(`⚠️  Possible untranslated keys: ${uniqueKeys.join(', ')}`);
      }
      
      if (check.translationErrors.length === 0 && suspiciousKeys.length <= 2) {
        check.status = 'passed';
        check.details.push('✅ No translation errors detected');
        check.details.push('✅ No obvious untranslated keys found');
      } else if (check.translationErrors.length > 0) {
        check.status = 'failed';
      } else {
        check.status = 'warning';
      }
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during translation validation: ${error.message}`);
    }
    
    return check;
  }

  async checkAccessibility(html, document) {
    const check = {
      name: 'Accessibility',
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      // Check images for alt text
      const images = document.querySelectorAll('img');
      let imagesWithoutAlt = 0;
      images.forEach(img => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          imagesWithoutAlt++;
        }
      });
      
      if (images.length > 0) {
        if (imagesWithoutAlt === 0) {
          check.details.push(`✅ All ${images.length} images have alt text`);
        } else {
          check.issues.push(`❌ ${imagesWithoutAlt}/${images.length} images missing alt text`);
        }
      }
      
      // Check heading structure
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      if (headings.length > 0) {
        check.details.push(`✅ Heading structure found: ${headings.length} headings`);
        
        const headingLevels = Array.from(headings).map(h => h.tagName);
        check.details.push(`✅ Heading levels: ${headingLevels.join(', ')}`);
      } else {
        check.issues.push('⚠️  No heading structure found');
      }
      
      // Check form labels
      const inputs = document.querySelectorAll('input, textarea, select');
      let unlabeledInputs = 0;
      inputs.forEach(input => {
        const hasLabel = input.labels && input.labels.length > 0;
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          unlabeledInputs++;
        }
      });
      
      if (inputs.length > 0) {
        if (unlabeledInputs === 0) {
          check.details.push(`✅ All ${inputs.length} form inputs properly labeled`);
        } else {
          check.issues.push(`❌ ${unlabeledInputs}/${inputs.length} form inputs missing labels`);
        }
      }
      
      // Check for ARIA landmarks
      const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer');
      if (landmarks.length > 0) {
        check.details.push(`✅ ARIA landmarks found: ${landmarks.length}`);
      } else {
        check.issues.push('⚠️  No ARIA landmarks found');
      }
      
      // Check for focus management
      const focusableElements = document.querySelectorAll('button, a, input, textarea, select, [tabindex]');
      if (focusableElements.length > 0) {
        check.details.push(`✅ Focusable elements found: ${focusableElements.length}`);
      }
      
      check.status = check.issues.some(issue => issue.startsWith('❌')) ? 'failed' : 
                   check.issues.length > 0 ? 'warning' : 'passed';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during accessibility check: ${error.message}`);
    }
    
    return check;
  }

  async checkResponsiveStructure(html, document) {
    const check = {
      name: 'Responsive Design Structure',
      status: 'unknown',
      details: [],
      issues: []
    };
    
    try {
      // Check viewport meta tag
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        const content = viewportMeta.getAttribute('content');
        check.details.push(`✅ Viewport meta tag: ${content}`);
      } else {
        check.issues.push('❌ Missing viewport meta tag');
      }
      
      // Check for CSS frameworks/responsive classes
      const bodyClasses = document.body.className;
      const allElements = document.querySelectorAll('*');
      let responsiveClasses = 0;
      
      allElements.forEach(el => {
        const classes = el.className;
        if (typeof classes === 'string' && 
            (classes.includes('sm:') || classes.includes('md:') || classes.includes('lg:') || 
             classes.includes('xl:') || classes.includes('responsive') || 
             classes.includes('mobile') || classes.includes('tablet'))) {
          responsiveClasses++;
        }
      });
      
      if (responsiveClasses > 0) {
        check.details.push(`✅ Responsive CSS classes found: ${responsiveClasses}`);
      } else {
        check.issues.push('⚠️  No responsive CSS classes detected');
      }
      
      // Check for CSS media queries in style tags
      const styleTags = document.querySelectorAll('style');
      let hasMediaQueries = false;
      styleTags.forEach(style => {
        if (style.textContent && style.textContent.includes('@media')) {
          hasMediaQueries = true;
        }
      });
      
      if (hasMediaQueries) {
        check.details.push('✅ CSS media queries found');
      }
      
      // Check for flexible layouts
      const flexElements = document.querySelectorAll('[class*="flex"], [class*="grid"]');
      if (flexElements.length > 0) {
        check.details.push(`✅ Flexible layout elements: ${flexElements.length}`);
      }
      
      check.status = check.issues.some(issue => issue.startsWith('❌')) ? 'failed' : 
                   check.issues.length > 0 ? 'warning' : 'passed';
      
    } catch (error) {
      check.status = 'failed';
      check.issues.push(`Error during responsive check: ${error.message}`);
    }
    
    return check;
  }

  async testAllAPIs() {
    for (const endpoint of API_ENDPOINTS) {
      console.log(`  🔌 Testing API: ${endpoint.method} ${endpoint.path}`);
      await this.testAPIEndpoint(endpoint);
    }
  }

  async testAPIEndpoint(endpoint) {
    const test = {
      name: `API: ${endpoint.method} ${endpoint.path}`,
      status: 'unknown',
      details: [],
      issues: [],
      responseData: null,
      timestamp: new Date().toISOString(),
      duration: 0
    };
    
    const startTime = Date.now();
    
    try {
      const response = await this.makeRequest(endpoint.path, endpoint.method);
      test.duration = Date.now() - startTime;
      
      if (response.ok) {
        test.details.push(`✅ HTTP ${response.status} ${response.statusText}`);
        test.details.push(`✅ Response time: ${test.duration}ms`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          test.responseData = data;
          
          // Validate expected fields
          if (endpoint.expectedFields.length > 0) {
            if (Array.isArray(data) && data.length > 0) {
              const firstItem = data[0];
              const missingFields = endpoint.expectedFields.filter(field => !(field in firstItem));
              
              if (missingFields.length === 0) {
                test.details.push(`✅ All expected fields present: ${endpoint.expectedFields.join(', ')}`);
              } else {
                test.issues.push(`❌ Missing fields: ${missingFields.join(', ')}`);
              }
              
              test.details.push(`✅ Array response with ${data.length} items`);
              
              // Sample some actual data
              const sampleData = JSON.stringify(firstItem).substring(0, 200);
              test.details.push(`✅ Sample data: ${sampleData}...`);
              
            } else if (typeof data === 'object' && data !== null) {
              const missingFields = endpoint.expectedFields.filter(field => !(field in data));
              
              if (missingFields.length === 0) {
                test.details.push(`✅ All expected fields present: ${endpoint.expectedFields.join(', ')}`);
              } else {
                test.issues.push(`❌ Missing fields: ${missingFields.join(', ')}`);
              }
              
              const sampleData = JSON.stringify(data).substring(0, 200);
              test.details.push(`✅ Sample data: ${sampleData}...`);
            }
          } else {
            // No specific fields expected, just validate it's meaningful data
            const dataSize = JSON.stringify(data).length;
            test.details.push(`✅ JSON response (${dataSize} chars)`);
          }
          
          // Check for mock data in API responses
          const responseText = JSON.stringify(data).toLowerCase();
          const foundMockData = FORBIDDEN_PATTERNS.filter(pattern => 
            responseText.includes(pattern.toLowerCase())
          );
          
          if (foundMockData.length === 0) {
            test.details.push('✅ No mock data in API response');
          } else {
            test.issues.push(`❌ Mock data in API: ${foundMockData.join(', ')}`);
          }
          
        } else {
          test.details.push(`✅ Response type: ${contentType}`);
        }
        
        test.status = test.issues.length === 0 ? 'passed' : 'warning';
        
      } else {
        test.status = 'failed';
        test.issues.push(`❌ HTTP ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      test.status = 'failed';
      test.duration = Date.now() - startTime;
      test.issues.push(`❌ Request failed: ${error.message}`);
    }
    
    // Update summary
    if (test.status === 'passed') {
      this.results.summary.passed++;
      console.log(`    ✅ ${endpoint.path} - PASSED (${test.duration}ms)`);
    } else if (test.status === 'failed') {
      this.results.summary.failed++;
      console.log(`    ❌ ${endpoint.path} - FAILED (${test.duration}ms)`);
    } else {
      this.results.summary.warnings++;
      console.log(`    ⚠️  ${endpoint.path} - WARNINGS (${test.duration}ms)`);
    }
    
    this.results.summary.totalTests++;
    this.results.apiTests.push(test);
  }

  async validateDataIntegrity() {
    console.log('  🔍 Cross-referencing client-worker relationships...');
    
    try {
      // Get all data
      const clientsResponse = await this.makeRequest('/api/clients', 'GET');
      const workersResponse = await this.makeRequest('/api/workers', 'GET');
      const assignmentsResponse = await this.makeRequest('/api/assignments', 'GET');
      
      if (!clientsResponse.ok || !workersResponse.ok || !assignmentsResponse.ok) {
        throw new Error('Could not fetch data for integrity validation');
      }
      
      const clients = await clientsResponse.json();
      const workers = await workersResponse.json();
      const assignments = await assignmentsResponse.json();
      
      const validation = {
        name: 'Data Integrity Validation',
        status: 'unknown',
        details: [],
        issues: [],
        metrics: {
          totalClients: clients.length,
          totalWorkers: workers.length,
          totalAssignments: assignments.length
        },
        timestamp: new Date().toISOString()
      };
      
      // Validate data relationships
      const clientIds = new Set(clients.map(c => c.id));
      const workerIds = new Set(workers.map(w => w.id));
      
      let invalidAssignments = 0;
      assignments.forEach(assignment => {
        if (!clientIds.has(assignment.clientId)) {
          invalidAssignments++;
        }
        if (!workerIds.has(assignment.workerId)) {
          invalidAssignments++;
        }
      });
      
      if (invalidAssignments === 0) {
        validation.details.push('✅ All assignment relationships valid');
      } else {
        validation.issues.push(`❌ ${invalidAssignments} invalid assignment relationships`);
      }
      
      // Check for duplicate data
      const clientEmails = clients.map(c => c.email).filter(e => e);
      const duplicateEmails = clientEmails.length !== new Set(clientEmails).size;
      
      if (!duplicateEmails) {
        validation.details.push('✅ No duplicate client emails');
      } else {
        validation.issues.push('❌ Duplicate client emails found');
      }
      
      // Validate data completeness
      const clientsWithMissingData = clients.filter(c => !c.name || !c.email);
      const workersWithMissingData = workers.filter(w => !w.name || !w.nationality);
      
      if (clientsWithMissingData.length === 0) {
        validation.details.push('✅ All clients have required data');
      } else {
        validation.issues.push(`❌ ${clientsWithMissingData.length} clients missing required data`);
      }
      
      if (workersWithMissingData.length === 0) {
        validation.details.push('✅ All workers have required data');
      } else {
        validation.issues.push(`❌ ${workersWithMissingData.length} workers missing required data`);
      }
      
      // Summary metrics
      validation.details.push(`📊 Data summary: ${clients.length} clients, ${workers.length} workers, ${assignments.length} assignments`);
      
      // Sample real data validation
      if (clients.length > 0) {
        const sampleClient = clients[0];
        validation.details.push(`✅ Sample client: ${sampleClient.name} (${sampleClient.email})`);
      }
      
      if (workers.length > 0) {
        const sampleWorker = workers[0];
        validation.details.push(`✅ Sample worker: ${sampleWorker.name} (${sampleWorker.nationality})`);
      }
      
      validation.status = validation.issues.length === 0 ? 'passed' : 'failed';
      
      if (validation.status === 'passed') {
        this.results.summary.passed++;
        console.log(`    ✅ Data integrity validation - PASSED`);
      } else {
        this.results.summary.failed++;
        console.log(`    ❌ Data integrity validation - FAILED`);
      }
      
      this.results.summary.totalTests++;
      this.results.dataValidation.push(validation);
      
    } catch (error) {
      const validation = {
        name: 'Data Integrity Validation',
        status: 'failed',
        details: [],
        issues: [`❌ Validation failed: ${error.message}`],
        timestamp: new Date().toISOString()
      };
      
      this.results.summary.failed++;
      this.results.summary.totalTests++;
      this.results.dataValidation.push(validation);
      console.log(`    ❌ Data integrity validation - ERROR: ${error.message}`);
    }
  }

  async analyzePerformance() {
    const performance = {
      name: 'Performance Analysis',
      timestamp: new Date().toISOString(),
      metrics: {
        averageResponseTime: 0,
        slowRequests: [],
        fastRequests: [],
        totalRequests: 0
      }
    };
    
    // Calculate performance metrics from completed tests
    const allTests = [...this.results.routeTests, ...this.results.apiTests];
    const testsWithDuration = allTests.filter(test => test.duration > 0);
    
    if (testsWithDuration.length > 0) {
      const totalDuration = testsWithDuration.reduce((sum, test) => sum + test.duration, 0);
      performance.metrics.averageResponseTime = Math.round(totalDuration / testsWithDuration.length);
      performance.metrics.totalRequests = testsWithDuration.length;
      
      // Identify slow requests (> 2 seconds)
      performance.metrics.slowRequests = testsWithDuration
        .filter(test => test.duration > 2000)
        .map(test => ({ name: test.name, duration: test.duration }));
      
      // Identify fast requests (< 500ms)
      performance.metrics.fastRequests = testsWithDuration
        .filter(test => test.duration < 500)
        .map(test => ({ name: test.name, duration: test.duration }));
      
      console.log(`    📊 Average response time: ${performance.metrics.averageResponseTime}ms`);
      console.log(`    ⚡ Fast requests: ${performance.metrics.fastRequests.length}`);
      console.log(`    🐌 Slow requests: ${performance.metrics.slowRequests.length}`);
    }
    
    this.results.performanceMetrics.push(performance);
  }

  async makeRequest(path, method = 'GET', body = null) {
    const url = `${CONFIG.baseUrl}${path}`;
    const options = {
      method,
      headers: {
        'User-Agent': 'ThoroughValidationSuite/1.0',
        'Accept': 'application/json, text/html, */*'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    
    return fetch(url, options);
  }

  calculateTestStatus(checks) {
    if (checks.some(check => check.status === 'failed')) {
      return 'failed';
    }
    if (checks.some(check => check.status === 'warning')) {
      return 'warning';
    }
    return 'passed';
  }

  logError(message, stack = '') {
    console.error(`❌ ${message}`);
    if (stack) console.error(stack);
    
    this.results.errors.push({
      type: 'validation-error',
      message,
      stack,
      timestamp: new Date().toISOString()
    });
  }

  async generateReport() {
    const endTime = new Date().toISOString();
    this.results.summary.endTime = endTime;
    
    // Calculate success rate
    const total = this.results.summary.totalTests;
    const passed = this.results.summary.passed;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    // Generate comprehensive JSON report
    const reportPath = path.join(CONFIG.reportDir, `thorough-validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate summary report
    const summaryPath = path.join(CONFIG.reportDir, `validation-summary-${Date.now()}.json`);
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: total,
      passed: passed,
      failed: this.results.summary.failed,
      warnings: this.results.summary.warnings,
      successRate: parseFloat(successRate),
      criticalIssues: this.results.routeTests
        .concat(this.results.apiTests)
        .concat(this.results.dataValidation)
        .filter(test => test.status === 'failed')
        .length,
      mockDataViolations: this.countMockDataViolations(),
      performanceMetrics: this.results.performanceMetrics[0]?.metrics || {}
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    
    // Print comprehensive summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 THOROUGH VALIDATION RESULTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`🔍 Total Tests Executed: ${total}`);
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${this.results.summary.failed}`);
    console.log(`⚠️  Tests with Warnings: ${this.results.summary.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`🕒 Test Duration: ${this.results.summary.startTime} - ${endTime}`);
    console.log(`🚨 Total Errors: ${this.results.errors.length}`);
    console.log(`📄 Detailed Report: ${reportPath}`);
    console.log(`📋 Summary Report: ${summaryPath}`);
    
    // Print critical failures
    if (this.results.summary.failed > 0) {
      console.log('\n🚨 CRITICAL FAILURES:');
      
      [...this.results.routeTests, ...this.results.apiTests, ...this.results.dataValidation]
        .filter(test => test.status === 'failed')
        .forEach(test => {
          console.log(`   ❌ ${test.name}:`);
          test.issues?.forEach(issue => {
            console.log(`      ${issue}`);
          });
          test.checks?.forEach(check => {
            if (check.status === 'failed') {
              check.issues?.forEach(issue => {
                console.log(`      ${issue}`);
              });
            }
          });
        });
    }
    
    // Mock data violations summary
    const mockDataViolations = this.countMockDataViolations();
    if (mockDataViolations > 0) {
      console.log(`\n❌ MOCK DATA VIOLATIONS: ${mockDataViolations} found`);
    } else {
      console.log('\n✅ NO MOCK DATA FOUND - All content is real data');
    }
    
    // Final verdict
    if (this.results.summary.failed === 0 && mockDataViolations === 0) {
      console.log('\n🎉 ALL VALIDATION TESTS PASSED!');
      console.log('✨ Your application is thoroughly validated:');
      console.log('   ✅ All pages load correctly');
      console.log('   ✅ All APIs return real data');
      console.log('   ✅ No mock or placeholder content');
      console.log('   ✅ Proper HTML structure and accessibility');
      console.log('   ✅ Translation system working');
      console.log('   ✅ Responsive design structure in place');
    } else {
      console.log('\n❌ VALIDATION FAILED!');
      console.log('Critical issues found that require immediate attention:');
      if (this.results.summary.failed > 0) {
        console.log(`   ❌ ${this.results.summary.failed} test failures`);
      }
      if (mockDataViolations > 0) {
        console.log(`   ❌ ${mockDataViolations} mock data violations`);
      }
    }
    
    console.log('='.repeat(80));
  }

  countMockDataViolations() {
    let violations = 0;
    
    this.results.routeTests.forEach(test => {
      test.checks?.forEach(check => {
        if (check.name === 'Mock Data Detection' && check.forbiddenFound) {
          violations += check.forbiddenFound.length;
        }
      });
    });
    
    this.results.apiTests.forEach(test => {
      if (test.issues?.some(issue => issue.includes('Mock data in API'))) {
        violations++;
      }
    });
    
    return violations;
  }
}

// Main execution
async function main() {
  const validator = new ThoroughValidationSuite();
  
  try {
    const results = await validator.runThoroughValidation();
    
    // Exit with appropriate code
    if (results.summary.failed > 0 || validator.countMockDataViolations() > 0) {
      console.log('\n❌ Validation failed - exiting with error code');
      process.exit(1);
    } else {
      console.log('\n✅ All validation tests passed - success!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Validation suite crashed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export default ThoroughValidationSuite;

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}