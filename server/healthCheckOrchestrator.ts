import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { Response } from 'express';

const execAsync = promisify(exec);

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  message?: string;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: string[];
  command: string;
}

export class HealthCheckOrchestrator {
  private response: Response | null = null;
  private totalTests = 0;
  private completedTests = 0;
  private passedTests = 0;
  private failedTests = 0;

  // Define test suites in order of execution to prevent breaking fixes
  private testSuites: TestSuite[] = [
    {
      name: 'Data Validation',
      tests: [
        'No Mock Data Verification',
        'Database Schema Validation',
        'Foreign Key Constraints',
        'Data Consistency Check'
      ],
      command: 'node scripts/thorough-validation-test.js --data-only'
    },
    {
      name: 'API Integration',
      tests: [
        'API Endpoints',
        'Response Formats',
        'Error Handling',
        'Rate Limiting'
      ],
      command: 'node scripts/http-frontend-test.js'
    },
    {
      name: 'Security & RBAC',
      tests: [
        'Role-Based Access',
        'Authentication Flow',
        'Permission Boundaries',
        'Session Management'
      ],
      command: 'node scripts/authenticated-ui-test.js'
    },
    {
      name: 'UI Validation',
      tests: [
        'Component Rendering',
        'Form Validation',
        'Navigation Flow',
        'Responsive Design'
      ],
      command: 'node scripts/quick-ui-validation.js'
    },
    {
      name: 'Comprehensive Validation',
      tests: [
        'Full System Check',
        'Regression Tests',
        'Performance Metrics',
        'Mock Data Detection'
      ],
      command: 'node scripts/thorough-validation-test.js'
    }
  ];

  constructor() {
    this.totalTests = this.testSuites.reduce((sum, suite) => sum + suite.tests.length, 0);
  }

  private sendUpdate(data: any) {
    if (this.response && !this.response.headersSent) {
      this.response.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  }

  private sendLog(message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') {
    this.sendUpdate({
      type: 'log',
      message,
      level,
      timestamp: new Date().toISOString()
    });
  }

  private sendProgress() {
    const progress = (this.completedTests / this.totalTests) * 100;
    this.sendUpdate({
      type: 'progress',
      progress,
      currentTest: `${this.completedTests}/${this.totalTests} tests completed`,
      passed: this.passedTests,
      failed: this.failedTests
    });
  }

  private async runTestSuite(suite: TestSuite, categoryIndex: number): Promise<TestResult[]> {
    const results: TestResult[] = [];
    this.sendLog(`Starting ${suite.name} tests...`, 'info');

    try {
      // Run the test command
      const startTime = Date.now();
      const { stdout, stderr } = await execAsync(suite.command, {
        timeout: 60000, // 60 second timeout per suite
        cwd: process.cwd()
      });

      const duration = Date.now() - startTime;
      
      // Parse results from stdout
      const passed = stdout.includes('PASSED') || stdout.includes('✓') || !stderr;
      
      // Update each test in the suite
      for (let i = 0; i < suite.tests.length; i++) {
        const testPassed = passed && !stderr;
        const status = testPassed ? 'passed' : 'failed';
        
        results.push({
          name: suite.tests[i],
          status,
          duration: Math.floor(duration / suite.tests.length),
          message: testPassed ? 'Test passed' : stderr || 'Test failed'
        });

        this.completedTests++;
        if (testPassed) {
          this.passedTests++;
        } else {
          this.failedTests++;
        }

        // Send test update
        this.sendUpdate({
          type: 'test-update',
          categoryIndex,
          testIndex: i,
          status,
          message: results[results.length - 1].message
        });

        this.sendProgress();
      }

      this.sendLog(`${suite.name} completed: ${results.filter(r => r.status === 'passed').length}/${suite.tests.length} passed`, 
        results.every(r => r.status === 'passed') ? 'success' : 'warning');

    } catch (error) {
      // If command fails, mark all tests as failed
      for (let i = 0; i < suite.tests.length; i++) {
        results.push({
          name: suite.tests[i],
          status: 'failed',
          duration: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        this.completedTests++;
        this.failedTests++;

        this.sendUpdate({
          type: 'test-update',
          categoryIndex,
          testIndex: i,
          status: 'failed',
          message: results[results.length - 1].error
        });
      }

      this.sendLog(`${suite.name} failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      this.sendProgress();
    }

    return results;
  }

  private async checkPrerequisites(): Promise<boolean> {
    this.sendLog('Checking prerequisites...', 'info');

    // Check if test scripts exist
    const scriptsDir = path.join(process.cwd(), 'scripts');
    try {
      const files = await fs.readdir(scriptsDir);
      const requiredScripts = [
        'thorough-validation-test.js',
        'http-frontend-test.js',
        'authenticated-ui-test.js',
        'quick-ui-validation.js'
      ];

      for (const script of requiredScripts) {
        if (!files.includes(script)) {
          this.sendLog(`Missing test script: ${script}`, 'error');
          return false;
        }
      }

      this.sendLog('All test scripts found', 'success');
      return true;
    } catch (error) {
      this.sendLog('Failed to check test scripts', 'error');
      return false;
    }
  }

  public async runAllTests(response: Response): Promise<void> {
    this.response = response;
    this.completedTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;

    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    this.sendLog('Starting comprehensive system health check...', 'info');
    this.sendLog(`Total tests to run: ${this.totalTests}`, 'info');

    // Check prerequisites
    const prereqCheck = await this.checkPrerequisites();
    if (!prereqCheck) {
      this.sendLog('Prerequisites check failed. Some tests may not run.', 'warning');
    }

    // Run test suites in sequence
    const allResults: TestResult[] = [];
    
    for (let i = 0; i < this.testSuites.length; i++) {
      const suite = this.testSuites[i];
      this.sendLog(`\n=== Running ${suite.name} (${i + 1}/${this.testSuites.length}) ===`, 'info');
      
      const results = await this.runTestSuite(suite, i);
      allResults.push(...results);
      
      // Small delay between suites to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate summary
    const summary = {
      total: this.totalTests,
      passed: this.passedTests,
      failed: this.failedTests,
      successRate: Math.round((this.passedTests / this.totalTests) * 100),
      timestamp: new Date().toISOString()
    };

    // Save results to file
    const resultsDir = path.join(process.cwd(), 'scripts', 'test-results', 'reports');
    try {
      await fs.mkdir(resultsDir, { recursive: true });
      const reportFile = path.join(resultsDir, `health-check-${Date.now()}.json`);
      await fs.writeFile(reportFile, JSON.stringify({
        summary,
        results: allResults,
        suites: this.testSuites.map(s => s.name)
      }, null, 2));
      
      this.sendLog(`Results saved to ${reportFile}`, 'info');
    } catch (error) {
      this.sendLog('Failed to save results to file', 'warning');
    }

    // Send completion
    this.sendLog(`\n=== Health Check Complete ===`, summary.failed === 0 ? 'success' : 'warning');
    this.sendLog(`Passed: ${summary.passed}/${summary.total} (${summary.successRate}%)`, 
      summary.successRate === 100 ? 'success' : summary.successRate >= 80 ? 'warning' : 'error');

    this.sendUpdate({
      type: 'complete',
      ...summary
    });

    // Close the connection
    response.end();
  }

  public async runQuickCheck(): Promise<any> {
    // Quick health check that just verifies system is running
    try {
      const checks = {
        server: true,
        database: false,
        storage: false,
        scripts: false
      };

      // Check database connection
      try {
        const { db } = require('./db');
        await db.query.users.findFirst();
        checks.database = true;
      } catch (e) {
        // Database not available
      }

      // Check if test scripts exist
      try {
        const scriptsDir = path.join(process.cwd(), 'scripts');
        const files = await fs.readdir(scriptsDir);
        checks.scripts = files.some(f => f.includes('validation'));
      } catch (e) {
        // Scripts not found
      }

      return {
        status: 'ok',
        checks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }
}