import * as fs from 'fs';
import * as path from 'path';

/**
 * Audit script to verify OTP authentication calls don't include emailRedirectTo
 * This prevents regressions where OTP accidentally gets a redirect parameter
 */

interface OtpCall {
  file: string;
  line: number;
  context: string;
  hasEmailRedirectTo: boolean;
  isOtpMode: boolean;
}

function scanFile(filePath: string): OtpCall[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const calls: OtpCall[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('signInWithOtp')) {
      const contextStart = Math.max(0, i - 5);
      const contextEnd = Math.min(lines.length, i + 6);
      const context = lines.slice(contextStart, contextEnd).join('\n');
      
      const isOtpMode = 
        context.toLowerCase().includes('otp') ||
        context.toLowerCase().includes('email code') ||
        context.toLowerCase().includes('six-digit') ||
        context.toLowerCase().includes('6-digit') ||
        !context.includes('emailRedirectTo');
      
      const hasEmailRedirectTo = context.includes('emailRedirectTo');
      
      calls.push({
        file: filePath,
        line: i + 1,
        context,
        hasEmailRedirectTo,
        isOtpMode,
      });
    }
  }
  
  return calls;
}

function scanDirectory(dir: string, extensions: string[] = ['.ts', '.tsx']): OtpCall[] {
  let allCalls: OtpCall[] = [];
  
  function scanRecursive(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build' ||
          entry.name === '.git' ||
          entry.name === 'test-results') {
        continue;
      }
      
      if (entry.isDirectory()) {
        scanRecursive(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          const calls = scanFile(fullPath);
          allCalls = allCalls.concat(calls);
        }
      }
    }
  }
  
  scanRecursive(dir);
  return allCalls;
}

async function main() {
  console.log('🔍 Auditing Supabase Auth Calls');
  console.log('================================\n');
  
  const projectRoot = process.cwd();
  const clientDir = path.join(projectRoot, 'client', 'src');
  
  const calls = scanDirectory(clientDir);
  
  console.log(`Found ${calls.length} signInWithOtp call(s)\n`);
  
  let violations = 0;
  const results: any[] = [];
  
  for (const call of calls) {
    const isViolation = call.isOtpMode && call.hasEmailRedirectTo;
    
    if (isViolation) {
      violations++;
      console.log(`❌ VIOLATION: OTP mode should NOT have emailRedirectTo`);
    } else if (call.isOtpMode) {
      console.log(`✅ PASS: OTP mode without emailRedirectTo`);
    } else if (call.hasEmailRedirectTo) {
      console.log(`✅ PASS: Magic Link mode with emailRedirectTo`);
    } else {
      console.log(`⚠️  WARNING: signInWithOtp without clear mode indication`);
    }
    
    console.log(`   File: ${path.relative(projectRoot, call.file)}:${call.line}`);
    console.log();
    
    results.push({
      file: path.relative(projectRoot, call.file),
      line: call.line,
      isOtpMode: call.isOtpMode,
      hasEmailRedirectTo: call.hasEmailRedirectTo,
      isViolation,
      context: call.context.substring(0, 200) + '...',
    });
  }
  
  const artifactsDir = path.join(projectRoot, 'artifacts', 'audit');
  fs.mkdirSync(artifactsDir, { recursive: true });
  
  const report = {
    timestamp: new Date().toISOString(),
    totalCalls: calls.length,
    violations,
    passed: calls.length - violations,
    details: results,
  };
  
  const reportPath = path.join(artifactsDir, 'otp-usage.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Summary:`);
  console.log(`============`);
  console.log(`Total calls: ${calls.length}`);
  console.log(`Violations:  ${violations}`);
  console.log(`Passed:      ${calls.length - violations}`);
  console.log(`\nReport saved to: ${path.relative(projectRoot, reportPath)}`);
  
  const summaryMd = `# OTP Authentication Audit Report

Generated: ${new Date().toISOString()}

## Summary

- **Total signInWithOtp calls:** ${calls.length}
- **Violations:** ${violations}
- **Passed:** ${calls.length - violations}

## Rules

1. ✅ OTP mode (Email Code) must NOT include \`emailRedirectTo\` parameter
2. ✅ Magic Link mode must INCLUDE \`emailRedirectTo\` parameter

## Violations

${violations === 0 ? 'None! All authentication calls follow the correct pattern.' : results.filter(r => r.isViolation).map(r => `- \`${r.file}:${r.line}\` - OTP mode incorrectly includes emailRedirectTo`).join('\n')}

## Details

${results.map(r => `
### ${r.file}:${r.line}

- **Mode:** ${r.isOtpMode ? 'OTP (Email Code)' : 'Magic Link'}
- **Has emailRedirectTo:** ${r.hasEmailRedirectTo ? 'Yes' : 'No'}
- **Status:** ${r.isViolation ? '❌ VIOLATION' : '✅ PASS'}
`).join('\n')}
`;
  
  const summaryPath = path.join(artifactsDir, 'summary.md');
  fs.writeFileSync(summaryPath, summaryMd);
  
  console.log(`Summary saved to: ${path.relative(projectRoot, summaryPath)}\n`);
  
  if (violations > 0) {
    console.error(`\n❌ AUDIT FAILED: ${violations} violation(s) found`);
    process.exit(1);
  } else {
    console.log(`\n✅ AUDIT PASSED: All authentication calls follow correct patterns`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Error running audit:', error);
  process.exit(1);
});
