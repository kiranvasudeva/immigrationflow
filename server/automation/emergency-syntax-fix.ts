#!/usr/bin/env node
/**
 * EMERGENCY SYNTAX FIX
 * Fixes critical syntax issues preventing server start
 */

import { readFileSync, writeFileSync } from 'fs';

function fixSyntaxErrors() {
  console.log('🚨 EMERGENCY SYNTAX FIX');
  console.log('========================\n');
  
  try {
    const routesContent = readFileSync('server/routes.ts', 'utf8');
    
    // Find and fix the malformed workflow array
    let fixedContent = routesContent;
    
    // Fix the specific syntax error around line 1922
    fixedContent = fixedContent.replace(
      /}\s*,\s*{\s*id:\s*'residence-permit-temp'/,
      `},
        {
          id: 'residence-permit-temp'`
    );
    
    // Remove any duplicate closing braces
    fixedContent = fixedContent.replace(/}\s*}\s*]/g, '}]');
    
    // Ensure proper array structure
    fixedContent = fixedContent.replace(
      /stages: ROMANIAN_WORK_PERMIT_WORKFLOW\.map\(mapWorkflowStepToAPI\)\s*}\s*}\s*]/,
      `stages: ROMANIAN_WORK_PERMIT_WORKFLOW.map(mapWorkflowStepToAPI)
        }
      ];`
    );
    
    writeFileSync('server/routes.ts', fixedContent);
    
    console.log('✅ Critical syntax errors fixed');
    console.log('🔄 Routes.ts syntax corrected');
    
    return true;
  } catch (error) {
    console.error('❌ Emergency syntax fix failed:', error);
    return false;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = fixSyntaxErrors();
  process.exit(success ? 0 : 1);
}