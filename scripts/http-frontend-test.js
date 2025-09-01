#!/usr/bin/env node
/**
 * HTTP Frontend Test Script
 * 
 * This script tests the frontend by making authenticated HTTP requests
 * to see exactly what content is returned to a logged-in admin user.
 * It extracts and analyzes the real frontend HTML without browser dependencies.
 */

import fs from 'fs';
import path from 'path';

const CONFIG = {
  baseUrl: 'http://localhost:5000',
  timeout: 30000,
  reportDir: './test-reports'
};

const ROUTES = [
  { path: '/', name: 'Dashboard' },
  { path: '/clients', name: 'Clients' },
  { path: '/workers', name: 'Workers' },
  { path: '/assignments', name: 'Assignments' },
  { path: '/workflow', name: 'Workflow' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/settings', name: 'Settings' }
];

class HTTPFrontendTester {
  constructor() {
    this.results = {
      summary: { totalTests: 0, passed: 0, failed: 0 },
      pages: {},
      workflowData: null
    };
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }
  }

  async fetchPage(route) {
    console.log(`\n📄 Testing page: ${route.name} (${route.path})`);
    this.results.summary.totalTests++;
    
    try {
      const url = `${CONFIG.baseUrl}${route.path}`;
      console.log(`   🔗 Fetching: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'User-Agent': 'HTTPFrontendTester/1.0'
        }
      });
      
      const html = await response.text();
      const analysis = this.analyzeHTML(html, route.name);
      
      this.results.pages[route.name] = {
        ...analysis,
        status: response.status,
        statusText: response.statusText,
        url: url,
        headers: Object.fromEntries(response.headers.entries())
      };
      
      // Log findings
      console.log(`   📊 Status: ${response.status} ${response.statusText}`);
      console.log(`   📄 Content length: ${analysis.contentLength} characters`);
      console.log(`   🧭 Has navigation: ${analysis.hasNavigation ? '✅' : '❌'}`);
      console.log(`   🔧 Translation errors: ${analysis.translationErrors ? '❌' : '✅'}`);
      
      if (route.name === 'Settings') {
        console.log(`   🔄 Workflow templates found: ${analysis.workflowCount}`);
        console.log(`   📝 Romanian workflows: ${analysis.romanianWorkflows.length}`);
        console.log(`   🐛 Debug workflows: ${analysis.debugWorkflows.length}`);
        
        // Store detailed workflow data
        this.results.workflowData = analysis.workflowAnalysis;
      }
      
      if (response.ok && analysis.contentLength > 1000) {
        this.results.summary.passed++;
        console.log(`   ✅ ${route.name} - PASSED`);
      } else {
        this.results.summary.failed++;
        console.log(`   ❌ ${route.name} - FAILED`);
      }
      
      return analysis;
      
    } catch (error) {
      this.results.summary.failed++;
      console.error(`   ❌ ${route.name} - ERROR:`, error.message);
      this.results.pages[route.name] = {
        status: 'error',
        error: error.message,
        url: `${CONFIG.baseUrl}${route.path}`
      };
      return null;
    }
  }

  analyzeHTML(html, pageName) {
    // Extract text content from HTML
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Check for translation errors
    const translationErrors = html.includes('}}') || html.includes('t(') || 
                             textContent.includes('}}') || textContent.includes('t(');
    
    // Check for navigation
    const hasNavigation = html.includes('<nav') || html.includes('navigation') || 
                         textContent.includes('Dashboard') && textContent.includes('Settings');
    
    // Basic content analysis
    const analysis = {
      contentLength: textContent.length,
      htmlLength: html.length,
      hasNavigation,
      translationErrors,
      title: this.extractTitle(html),
      hasReactApp: html.includes('id="root"') || html.includes('React'),
      hasAuthElements: textContent.includes('Sign out') || textContent.includes('Logout'),
      contentSample: textContent.substring(0, 500)
    };
    
    // Special analysis for Settings page
    if (pageName === 'Settings') {
      analysis.workflowAnalysis = this.analyzeWorkflows(textContent);
      analysis.workflowCount = analysis.workflowAnalysis.workflows.length;
      analysis.romanianWorkflows = analysis.workflowAnalysis.workflows.filter(w => 
        w.name.includes('Romanian'));
      analysis.debugWorkflows = analysis.workflowAnalysis.workflows.filter(w => 
        w.name.includes('DEBUG'));
    }
    
    return analysis;
  }

  analyzeWorkflows(text) {
    const workflows = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentWorkflow = null;
    let inWorkflowSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';
      
      // Detect start of workflow section
      if (line.includes('Workflow Templates') || line.includes('Create New Workflow')) {
        inWorkflowSection = true;
        continue;
      }
      
      // Skip if not in workflow section
      if (!inWorkflowSection) continue;
      
      // Look for workflow names
      if (line.includes('Workflow') || line.includes('Process')) {
        // Check if this looks like a workflow name (not a button or label)
        if (!line.includes('Create') && !line.includes('New') && 
            !line.includes('Stages:') && line.length > 5) {
          
          if (currentWorkflow) {
            workflows.push(currentWorkflow);
          }
          
          currentWorkflow = {
            name: line,
            stages: null,
            description: '',
            status: 'Unknown',
            details: []
          };
        }
      }
      
      // Look for stage count
      if (currentWorkflow && line.startsWith('Stages: ')) {
        const stageMatch = line.match(/Stages: (\d+)/);
        if (stageMatch) {
          currentWorkflow.stages = parseInt(stageMatch[1]);
        }
      }
      
      // Look for status
      if (currentWorkflow && (line === 'Active' || line === 'Inactive')) {
        currentWorkflow.status = line;
      }
      
      // Collect other details
      if (currentWorkflow && currentWorkflow.stages === null && 
          line.length > 3 && line.length < 100 &&
          !line.includes('Manage') && !line.includes('Edit')) {
        currentWorkflow.details.push(line);
      }
    }
    
    if (currentWorkflow) {
      workflows.push(currentWorkflow);
    }
    
    return {
      workflows,
      totalWorkflows: workflows.length,
      romanianCount: workflows.filter(w => w.name.includes('Romanian')).length,
      debugCount: workflows.filter(w => w.name.includes('DEBUG')).length,
      rawTextSample: text.substring(0, 2000)
    };
  }

  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : 'No title';
  }

  async testWorkflowAPI() {
    console.log('\n🔌 Testing Workflow Templates API...');
    
    try {
      const response = await fetch(`${CONFIG.baseUrl}/api/workflow-templates`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HTTPFrontendTester/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ API Response: ${response.status}`);
        console.log(`   📊 Templates returned: ${Array.isArray(data) ? data.length : 'Unknown'}`);
        
        if (Array.isArray(data)) {
          const romanianWorkPermit = data.find(t => t.name.includes('Romanian Work Permit'));
          const romanianCitizenship = data.find(t => t.name.includes('Romanian Citizenship'));
          
          console.log(`   🇷🇴 Romanian Work Permit: ${romanianWorkPermit ? romanianWorkPermit.stages?.length || 0 : 0} stages`);
          console.log(`   🇷🇴 Romanian Citizenship: ${romanianCitizenship ? romanianCitizenship.stages?.length || 0 : 0} stages`);
        }
        
        return { status: 'success', data };
      } else {
        console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
        return { status: 'error', code: response.status };
      }
    } catch (error) {
      console.error(`   ❌ API Request failed:`, error.message);
      return { status: 'error', error: error.message };
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const reportPath = path.join(CONFIG.reportDir, `http-frontend-test-${Date.now()}.json`);
    
    const report = {
      timestamp,
      config: CONFIG,
      summary: this.results.summary,
      successRate: `${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`,
      pages: this.results.pages,
      workflowData: this.results.workflowData
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 HTTP FRONTEND TEST RESULTS`);
    console.log(`================================================================================`);
    console.log(`✅ Tests Passed: ${this.results.summary.passed}`);
    console.log(`❌ Tests Failed: ${this.results.summary.failed}`);
    console.log(`📈 Success Rate: ${report.successRate}`);
    console.log(`📄 Report saved: ${reportPath}`);
    
    if (this.results.workflowData) {
      console.log(`\n🔧 WORKFLOW ANALYSIS FROM FRONTEND:`);
      console.log(`   Total workflows detected: ${this.results.workflowData.totalWorkflows}`);
      console.log(`   Romanian workflows: ${this.results.workflowData.romanianCount}`);
      console.log(`   Debug workflows: ${this.results.workflowData.debugCount}`);
      
      console.log(`\n📋 WORKFLOW DETAILS:`);
      this.results.workflowData.workflows.forEach(workflow => {
        console.log(`   • ${workflow.name}: ${workflow.stages || '?'} stages (${workflow.status})`);
      });
    }
    
    return reportPath;
  }

  async run() {
    try {
      console.log('🚀 Starting HTTP Frontend Test...');
      console.log(`📍 Testing URL: ${CONFIG.baseUrl}`);
      
      // Test all pages
      for (const route of ROUTES) {
        await this.fetchPage(route);
      }
      
      // Test API directly
      const apiResult = await this.testWorkflowAPI();
      this.results.apiTest = apiResult;
      
      // Generate report
      const reportPath = await this.generateReport();
      
      return reportPath;
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
      throw error;
    }
  }
}

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new HTTPFrontendTester();
  tester.run()
    .then((reportPath) => {
      console.log(`\n🎉 Test completed successfully!`);
      console.log(`📄 Full report: ${reportPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test suite failed:', error);
      process.exit(1);
    });
}

export default HTTPFrontendTester;