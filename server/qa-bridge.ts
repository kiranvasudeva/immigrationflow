import { Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { sql } from 'drizzle-orm';

// Logging function
function logAction(action: string, params: any, result: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ACTION: ${action} - PARAMS: ${JSON.stringify(params)} - RESULT: ${JSON.stringify(result).substring(0, 200)}...\n`;
  fs.appendFileSync('qa_bridge.log', logEntry);
}

// Get directory tree recursively
function getDirectoryTree(dirPath: string, maxDepth: number = 5, currentDepth: number = 0): any {
  if (currentDepth >= maxDepth) return null;
  
  const items: any[] = [];
  try {
    const entries = fs.readdirSync(dirPath);
    
    for (const entry of entries) {
      if (entry.startsWith('.') && entry !== '.env.example') continue;
      
      const fullPath = path.join(dirPath, entry);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        items.push({
          name: entry,
          type: 'directory',
          path: fullPath,
          children: getDirectoryTree(fullPath, maxDepth, currentDepth + 1)
        });
      } else {
        items.push({
          name: entry,
          type: 'file',
          path: fullPath,
          size: stats.size
        });
      }
    }
  } catch (error) {
    return { error: `Unable to read directory: ${error}` };
  }
  
  return items;
}

// QA Bridge handler
export async function handleQABridge(req: Request, res: Response) {
  console.log('QA Bridge called with:', req.body);
  const { action, params } = req.body;
  
  try {
    let result: any = {};
    
    switch (action) {
      case 'listFiles':
        result = {
          projectRoot: process.cwd(),
          tree: getDirectoryTree(process.cwd())
        };
        break;
        
      case 'readFile':
        if (!params?.path) {
          return res.status(400).json({ error: 'Missing file path' });
        }
        try {
          const content = fs.readFileSync(params.path, 'utf8');
          result = {
            path: params.path,
            content,
            size: content.length
          };
        } catch (error) {
          result = { error: `Unable to read file: ${error}` };
        }
        break;
        
      case 'writeFile':
        if (!params?.path || params?.content === undefined) {
          return res.status(400).json({ error: 'Missing file path or content' });
        }
        try {
          fs.writeFileSync(params.path, params.content, 'utf8');
          result = {
            path: params.path,
            success: true,
            bytesWritten: params.content.length
          };
        } catch (error) {
          result = { error: `Unable to write file: ${error}` };
        }
        break;
        
      case 'listRoutes':
        // Scan backend routes
        const backendRoutes: string[] = [];
        try {
          const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
          const routeMatches = routesContent.match(/app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g);
          if (routeMatches) {
            routeMatches.forEach(match => {
              const routeMatch = match.match(/app\.(\w+)\(['"]([^'"]+)['"]/);
              if (routeMatch) {
                backendRoutes.push(`${routeMatch[1].toUpperCase()} ${routeMatch[2]}`);
              }
            });
          }
        } catch (error) {
          backendRoutes.push(`Error reading routes: ${error}`);
        }
        
        // Scan frontend routes
        const frontendRoutes: string[] = [];
        try {
          const appContent = fs.readFileSync('client/src/App.tsx', 'utf8');
          const routeMatches = appContent.match(/path=['"]([^'"]+)['"]/g);
          if (routeMatches) {
            routeMatches.forEach(match => {
              const pathMatch = match.match(/path=['"]([^'"]+)['"]/);
              if (pathMatch) {
                frontendRoutes.push(pathMatch[1]);
              }
            });
          }
        } catch (error) {
          frontendRoutes.push(`Error reading frontend routes: ${error}`);
        }
        
        result = {
          backend: backendRoutes,
          frontend: frontendRoutes
        };
        break;
        
      case 'queryDB':
        if (!params?.table) {
          return res.status(400).json({ error: 'Missing table name' });
        }
        try {
          const limit = params.limit || 10;
          let queryStr = `SELECT * FROM ${params.table}`;
          
          if (params.where) {
            queryStr += ` WHERE ${params.where}`;
          }
          
          queryStr += ` LIMIT ${limit}`;
          
          const query = sql.raw(queryStr);
          const dbResult = await db.execute(query);
          result = {
            table: params.table,
            query: queryStr,
            rows: dbResult.rows,
            count: dbResult.rows.length
          };
        } catch (error) {
          result = { error: `Database query failed: ${error}` };
        }
        break;
        
      case 'runCommand':
        if (!params?.command) {
          return res.status(400).json({ error: 'Missing command' });
        }
        
        const allowedCommands = [
          'npm run dev',
          'npm run build', 
          'npx prisma migrate status',
          'npx prisma db pull'
        ];
        
        if (!allowedCommands.some(cmd => params.command.startsWith(cmd))) {
          return res.status(400).json({ error: 'Command not in allowlist' });
        }
        
        try {
          const output = execSync(params.command, { 
            encoding: 'utf8',
            timeout: 30000,
            cwd: process.cwd()
          });
          result = {
            command: params.command,
            output,
            success: true
          };
        } catch (error: any) {
          result = {
            command: params.command,
            error: error.message,
            output: error.stdout || '',
            success: false
          };
        }
        break;
        
      case 'runAI':
        result = {
          error: 'AI integration not available in this environment',
          prompt: params?.prompt || 'No prompt provided',
          suggestion: 'Use external AI tools and provide specific technical questions to the QA bridge instead'
        };
        break;
        
      case 'getLogs':
        const logType = params?.type || 'qa';
        try {
          if (logType === 'qa') {
            if (fs.existsSync('qa_bridge.log')) {
              const logContent = fs.readFileSync('qa_bridge.log', 'utf8');
              const lines = logContent.split('\n').filter(line => line.trim());
              result = {
                type: 'qa',
                lines: lines.slice(-50), // Last 50 entries
                total: lines.length
              };
            } else {
              result = { type: 'qa', lines: [], total: 0 };
            }
          } else if (logType === 'server') {
            // Get recent server logs from console (simulated)
            result = {
              type: 'server',
              info: 'Server logs available in workflow console',
              suggestion: 'Check workflow logs for detailed server output'
            };
          } else {
            result = { error: 'Invalid log type. Use: qa, server' };
          }
        } catch (error) {
          result = { error: `Failed to get logs: ${error}` };
        }
        break;
        
      case 'qaTests':
        const tests: any[] = [];
        
        // Test health endpoint
        try {
          const healthResponse = await fetch('http://localhost:5000/healthz');
          tests.push({
            name: 'Health Check',
            status: healthResponse.ok ? 'PASS' : 'FAIL',
            details: `Status: ${healthResponse.status}`
          });
        } catch (error) {
          tests.push({
            name: 'Health Check',
            status: 'FAIL',
            details: `Error: ${error}`
          });
        }
        
        // Test authentication for different roles
        const testCredentials = [
          { email: 'admin@demo.law', password: 'Demo!2345', role: 'ADMIN' },
          { email: 'client@demo.law', password: 'Demo!2345', role: 'OWNER' },
          { email: 'worker@demo.law', password: 'Demo!2345', role: 'WORKER' }
        ];
        
        for (const cred of testCredentials) {
          try {
            const loginResponse = await fetch('http://localhost:5000/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cred.email, password: cred.password })
            });
            
            tests.push({
              name: `Login Test - ${cred.role}`,
              status: loginResponse.ok ? 'PASS' : 'FAIL',
              details: `Status: ${loginResponse.status}`
            });
          } catch (error) {
            tests.push({
              name: `Login Test - ${cred.role}`,
              status: 'FAIL',
              details: `Error: ${error}`
            });
          }
        }
        
        // Test database connectivity
        try {
          const dbTest = await db.execute(sql`SELECT 1 as test`);
          tests.push({
            name: 'Database Connectivity',
            status: 'PASS',
            details: `Query successful: ${JSON.stringify(dbTest.rows)}`
          });
        } catch (error) {
          tests.push({
            name: 'Database Connectivity',
            status: 'FAIL',
            details: `Error: ${error}`
          });
        }
        
        result = {
          timestamp: new Date().toISOString(),
          totalTests: tests.length,
          passed: tests.filter(t => t.status === 'PASS').length,
          failed: tests.filter(t => t.status === 'FAIL').length,
          tests
        };
        break;
        
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
    
    logAction(action, params, result);
    res.json(result);
    
  } catch (error) {
    const errorResult = { error: `Bridge error: ${error}` };
    logAction(action, params, errorResult);
    res.status(500).json(errorResult);
  }
}