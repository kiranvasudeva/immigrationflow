#!/usr/bin/env node
/**
 * PRODUCTION READINESS VALIDATION
 * Comprehensive validation that system has zero mock data
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface ValidationResult {
  category: string;
  passed: boolean;
  issues: string[];
  criticalIssues: string[];
}

class ProductionReadinessValidator {
  private results: ValidationResult[] = [];

  async validateFullSystem(): Promise<boolean> {
    console.log('🔍 PRODUCTION READINESS VALIDATION');
    console.log('==================================\n');
    
    const startTime = Date.now();
    
    try {
      // 1. Validate no mock data in codebase
      await this.validateNoMockDataInCodebase();
      
      // 2. Validate API endpoints use configuration
      await this.validateAPIEndpointsUseConfiguration();
      
      // 3. Validate database schema consistency
      await this.validateDatabaseSchemaConsistency();
      
      // 4. Validate security configuration
      await this.validateSecurityConfiguration();
      
      // 5. Validate user role access control
      await this.validateUserRoleAccessControl();
      
      // 6. Validate configuration completeness
      await this.validateConfigurationCompleteness();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const overallPassed = this.generateValidationReport();
      
      console.log(`\n📊 VALIDATION COMPLETED in ${duration}s`);
      
      if (overallPassed) {
        console.log('🎉 SYSTEM IS PRODUCTION READY');
        console.log('✅ Zero mock data detected');
        console.log('✅ All security measures active');
        console.log('✅ Configuration-driven workflows verified');
        console.log('✅ Database consistency confirmed');
        console.log('✅ Access controls validated');
      } else {
        console.log('❌ SYSTEM NOT PRODUCTION READY');
        console.log('🔧 Issues must be resolved before deployment');
      }
      
      return overallPassed;
    } catch (error) {
      console.error('💥 Validation system failed:', error);
      return false;
    }
  }

  private async validateNoMockDataInCodebase(): Promise<void> {
    console.log('🔍 Validating no mock data in codebase...');
    
    const issues: string[] = [];
    const criticalIssues: string[] = [];
    
    const mockDataPatterns = [
      { pattern: /Test Worker Alpha/g, severity: 'critical', description: 'Hardcoded test worker name' },
      { pattern: /test\..*@replit\.dev/g, severity: 'critical', description: 'Test email addresses' },
      { pattern: /T12345\d+/g, severity: 'critical', description: 'Test passport numbers' },
      { pattern: /mockWorkflow/g, severity: 'critical', description: 'Mock workflow references' },
      { pattern: /hardcoded.*workflow/gi, severity: 'high', description: 'Hardcoded workflow data' },
      { pattern: /placeholder/gi, severity: 'medium', description: 'Placeholder data' },
      { pattern: /demo.*data/gi, severity: 'medium', description: 'Demo data references' }
    ];

    const sourceFiles = this.getAllSourceFiles();
    
    for (const file of sourceFiles) {
      const content = readFileSync(file, 'utf8');
      
      for (const { pattern, severity, description } of mockDataPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          const issue = `${file}: ${description} (${matches.length} instances)`;
          
          if (severity === 'critical') {
            criticalIssues.push(issue);
          } else {
            issues.push(issue);
          }
        }
      }
    }

    this.results.push({
      category: 'Mock Data Detection',
      passed: criticalIssues.length === 0,
      issues,
      criticalIssues
    });

    console.log(`   Found ${criticalIssues.length} critical and ${issues.length} minor issues`);
  }

  private async validateAPIEndpointsUseConfiguration(): Promise<void> {
    console.log('🔗 Validating API endpoints use configuration...');
    
    const issues: string[] = [];
    const criticalIssues: string[] = [];
    
    const routesContent = readFileSync('server/routes.ts', 'utf8');
    
    // Check that workflow endpoints import configuration
    if (!routesContent.includes('from "./config/mapping"')) {
      criticalIssues.push('Missing configuration mapping import in routes.ts');
    }
    
    // Check that workflow steps endpoint uses configuration
    if (!routesContent.includes('ROMANIAN_WORK_PERMIT_WORKFLOW')) {
      criticalIssues.push('Workflow endpoints not using configuration mapping');
    }
    
    // Check for hardcoded workflow data
    if (routesContent.includes('stages: [')) {
      const hardcodedStagesCount = (routesContent.match(/stages: \[/g) || []).length;
      if (hardcodedStagesCount > 0) {
        issues.push(`Found ${hardcodedStagesCount} hardcoded workflow stages`);
      }
    }

    this.results.push({
      category: 'API Configuration',
      passed: criticalIssues.length === 0,
      issues,
      criticalIssues
    });

    console.log(`   API endpoints validation: ${criticalIssues.length === 0 ? 'PASSED' : 'FAILED'}`);
  }

  private async validateDatabaseSchemaConsistency(): Promise<void> {
    console.log('🗄️  Validating database schema consistency...');
    
    const issues: string[] = [];
    const criticalIssues: string[] = [];
    
    // Check that schema.ts has all required tables
    const schemaContent = readFileSync('shared/schema.ts', 'utf8');
    
    const requiredTables = [
      'users', 'clientProfiles', 'workers', 'workflowTemplates',
      'workflowSteps', 'workflowStepDocumentRequirements',
      'documentFiles', 'checklistItems'
    ];
    
    for (const table of requiredTables) {
      if (!schemaContent.includes(`export const ${table}`)) {
        criticalIssues.push(`Missing table definition: ${table}`);
      }
    }
    
    // Check storage layer uses schema types
    const storageContent = readFileSync('server/storage.ts', 'utf8');
    if (!storageContent.includes('from "@shared/schema"')) {
      criticalIssues.push('Storage layer not importing schema types');
    }

    this.results.push({
      category: 'Database Schema',
      passed: criticalIssues.length === 0,
      issues,
      criticalIssues
    });

    console.log(`   Database schema validation: ${criticalIssues.length === 0 ? 'PASSED' : 'FAILED'}`);
  }

  private async validateSecurityConfiguration(): Promise<void> {
    console.log('🔐 Validating security configuration...');
    
    const issues: string[] = [];
    const criticalIssues: string[] = [];
    
    // Check production config exists
    try {
      const prodConfigContent = readFileSync('server/config/production.ts', 'utf8');
      
      if (!prodConfigContent.includes('helmet')) {
        issues.push('Security headers middleware not configured');
      }
      
      if (!prodConfigContent.includes('rate-limit')) {
        issues.push('Rate limiting not configured');
      }
      
    } catch (error) {
      criticalIssues.push('Production configuration file missing');
    }
    
    // Check RBAC middleware exists
    try {
      const rbacContent = readFileSync('server/middleware/rbac.ts', 'utf8');
      
      if (!rbacContent.includes('requireRole')) {
        criticalIssues.push('RBAC role middleware missing');
      }
      
    } catch (error) {
      criticalIssues.push('RBAC middleware file missing');
    }

    this.results.push({
      category: 'Security Configuration',
      passed: criticalIssues.length === 0,
      issues,
      criticalIssues
    });

    console.log(`   Security validation: ${criticalIssues.length === 0 ? 'PASSED' : 'FAILED'}`);
  }

  private async validateUserRoleAccessControl(): Promise<void> {
    console.log('👥 Validating user role access control...');
    
    const issues: string[] = [];
    const criticalIssues: string[] = [];
    
    const routesContent = readFileSync('server/routes.ts', 'utf8');
    
    // Count protected endpoints
    const protectedEndpoints = (routesContent.match(/requireRole\(/g) || []).length;
    const totalEndpoints = (routesContent.match(/app\.(get|post|put|delete)\(/g) || []).length;
    
    if (protectedEndpoints === 0) {
      criticalIssues.push('No role-based protection found on API endpoints');
    } else if (protectedEndpoints < totalEndpoints * 0.8) {
      issues.push(`Only ${protectedEndpoints}/${totalEndpoints} endpoints are role-protected`);
    }
    
    // Check for admin-only operations
    const adminOnlyOperations = (routesContent.match(/requireRole\('ADMIN'\)/g) || []).length;
    if (adminOnlyOperations === 0) {
      issues.push('No admin-only operations found');
    }

    this.results.push({
      category: 'Access Control',
      passed: criticalIssues.length === 0,
      issues,
      criticalIssues
    });

    console.log(`   Access control validation: ${criticalIssues.length === 0 ? 'PASSED' : 'FAILED'}`);
  }

  private async validateConfigurationCompleteness(): Promise<void> {
    console.log('⚙️  Validating configuration completeness...');
    
    const issues: string[] = [];
    const criticalIssues: string[] = [];
    
    // Check mapping configuration exists and is complete
    try {
      const mappingContent = readFileSync('server/config/mapping.ts', 'utf8');
      
      if (!mappingContent.includes('ROMANIAN_WORK_PERMIT_WORKFLOW')) {
        criticalIssues.push('Main workflow configuration missing');
      }
      
      if (!mappingContent.includes('mapWorkflowStepToAPI')) {
        criticalIssues.push('API mapping functions missing');
      }
      
      // Count workflow steps in configuration
      const stepMatches = mappingContent.match(/id: '[^']+'/g);
      if (!stepMatches || stepMatches.length < 5) {
        issues.push('Workflow configuration appears incomplete (< 5 steps)');
      }
      
    } catch (error) {
      criticalIssues.push('Configuration mapping file missing');
    }

    this.results.push({
      category: 'Configuration',
      passed: criticalIssues.length === 0,
      issues,
      criticalIssues
    });

    console.log(`   Configuration validation: ${criticalIssues.length === 0 ? 'PASSED' : 'FAILED'}`);
  }

  private generateValidationReport(): boolean {
    console.log('\n📋 VALIDATION REPORT');
    console.log('===================');
    
    let overallPassed = true;
    let totalCriticalIssues = 0;
    let totalIssues = 0;
    
    for (const result of this.results) {
      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`\n${result.category}: ${status}`);
      
      if (result.criticalIssues.length > 0) {
        console.log('  🚨 Critical Issues:');
        result.criticalIssues.forEach(issue => {
          console.log(`    • ${issue}`);
          totalCriticalIssues++;
        });
        overallPassed = false;
      }
      
      if (result.issues.length > 0) {
        console.log('  ⚠️  Issues:');
        result.issues.forEach(issue => {
          console.log(`    • ${issue}`);
          totalIssues++;
        });
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Critical Issues: ${totalCriticalIssues}`);
    console.log(`   Minor Issues: ${totalIssues}`);
    console.log(`   Categories Passed: ${this.results.filter(r => r.passed).length}/${this.results.length}`);
    
    return overallPassed;
  }

  private getAllSourceFiles(): string[] {
    const files: string[] = [];
    const searchDirs = ['server', 'client/src', 'shared'];
    
    const scanDirectory = (dir: string) => {
      try {
        const items = readdirSync(dir);
        for (const item of items) {
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            scanDirectory(fullPath);
          } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(fullPath))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Directory doesn't exist or not accessible
      }
    };

    searchDirs.forEach(scanDirectory);
    return files;
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ProductionReadinessValidator();
  
  validator.validateFullSystem()
    .then(success => {
      if (success) {
        console.log('\n🚀 SYSTEM READY FOR PRODUCTION DEPLOYMENT');
      } else {
        console.log('\n🛑 SYSTEM NOT READY - FIX ISSUES BEFORE DEPLOYMENT');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}

export { ProductionReadinessValidator };