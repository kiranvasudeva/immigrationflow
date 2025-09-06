import { Request, Response } from 'express';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { replayGuard } from '../services/replayGuard';
import { rateLimiter } from '../services/rateLimit';

const QA_MODE = process.env.QA_MODE === 'true';
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN;
const MAX_RESPONSE_SIZE = 200 * 1024; // 200KB

// Hash IP for privacy
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'salt').digest('hex').substring(0, 16);
}

// Audit logging
function auditLog(ip: string, action: string, result: 'ok' | 'err', error?: string) {
  const timestamp = new Date().toISOString();
  const hashedIP = hashIP(ip);
  const logEntry = `${timestamp} - IP:${hashedIP} - ACTION:${action} - RESULT:${result}${error ? ` - ERROR:${error}` : ''}\n`;
  fs.appendFileSync('qa_bridge_audit.log', logEntry);
}

// Truncate large responses
function truncateResponse(data: any): any {
  const json = JSON.stringify(data);
  if (json.length > MAX_RESPONSE_SIZE) {
    return {
      ...data,
      truncated: true,
      originalSize: json.length,
      data: JSON.stringify(data).substring(0, MAX_RESPONSE_SIZE - 100) + '...[truncated]'
    };
  }
  return data;
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

// Mask secrets in file content
function maskSecrets(filePath: string, content: string): string {
  if (filePath.includes('.env') || filePath.includes('secret') || filePath.includes('config')) {
    return content.replace(/([A-Z_]+)=([^\n\r]+)/g, (match, key, value) => {
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD')) {
        return `${key}=[MASKED]`;
      }
      return match;
    });
  }
  return content;
}

// Security middleware
export function qaBridgeAuth(req: Request, res: Response, next: Function) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Check if QA mode is enabled
    if (!QA_MODE) {
      auditLog(clientIP, 'access_denied', 'err', 'QA_MODE not enabled');
      return res.status(403).json({
        ok: false,
        error: { code: 'QA_MODE_DISABLED', message: 'QA Bridge is disabled' }
      });
    }

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      auditLog(clientIP, 'auth_missing', 'err', 'Missing authorization header');
      return res.status(401).json({
        ok: false,
        error: { code: 'AUTH_MISSING', message: 'Authorization header required' }
      });
    }

    const token = authHeader.substring(7);
    if (token !== BRIDGE_TOKEN) {
      auditLog(clientIP, 'auth_invalid', 'err', 'Invalid token');
      return res.status(401).json({
        ok: false,
        error: { code: 'AUTH_INVALID', message: 'Invalid token' }
      });
    }

    // Check timestamp and nonce
    const timestamp = req.headers['x-timestamp'] as string;
    const nonce = req.headers['x-nonce'] as string;

    if (!timestamp || !nonce) {
      auditLog(clientIP, 'headers_missing', 'err', 'Missing timestamp or nonce');
      return res.status(400).json({
        ok: false,
        error: { code: 'HEADERS_MISSING', message: 'X-Timestamp and X-Nonce headers required' }
      });
    }

    // Validate replay protection
    const replayCheck = replayGuard.validateRequest(timestamp, nonce);
    if (!replayCheck.valid) {
      auditLog(clientIP, 'replay_check', 'err', replayCheck.error);
      return res.status(409).json({
        ok: false,
        error: { code: 'REPLAY_DETECTED', message: replayCheck.error }
      });
    }

    // Check rate limit
    const rateLimitKey = `${hashIP(clientIP)}:${token}`;
    const rateCheck = rateLimiter.checkLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      auditLog(clientIP, 'rate_limit', 'err', 'Rate limit exceeded');
      return res.status(429).json({
        ok: false,
        error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded' },
        retryAfter: Math.ceil((rateCheck.resetTime - Date.now()) / 1000)
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', process.env.BRIDGE_RATE || '10');
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateCheck.resetTime / 1000).toString());

    next();
  } catch (error) {
    auditLog(clientIP, 'auth_error', 'err', String(error));
    return res.status(500).json({
      ok: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication error' }
    });
  }
}

// Main QA Bridge handler
export async function handleQABridge(req: Request, res: Response) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
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
          auditLog(clientIP, action, 'err', 'Missing file path');
          return res.status(400).json({
            ok: false,
            error: { code: 'MISSING_PATH', message: 'Missing file path' }
          });
        }
        try {
          const content = fs.readFileSync(params.path, 'utf8');
          const maskedContent = maskSecrets(params.path, content);
          result = {
            path: params.path,
            content: maskedContent,
            size: content.length
          };
        } catch (error) {
          auditLog(clientIP, action, 'err', String(error));
          return res.status(404).json({
            ok: false,
            error: { code: 'FILE_NOT_FOUND', message: `Unable to read file: ${error}` }
          });
        }
        break;
        
      case 'writeFile':
        if (!params?.path || params?.content === undefined) {
          auditLog(clientIP, action, 'err', 'Missing file path or content');
          return res.status(400).json({
            ok: false,
            error: { code: 'MISSING_PARAMS', message: 'Missing file path or content' }
          });
        }
        
        // Security check: block sensitive files
        if (/\.env|secrets|node_modules|\.git/.test(params.path)) {
          auditLog(clientIP, action, 'err', 'Blocked sensitive file write');
          return res.status(403).json({
            ok: false,
            error: { code: 'FORBIDDEN_PATH', message: 'Cannot write to sensitive files' }
          });
        }
        
        try {
          fs.writeFileSync(params.path, params.content, 'utf8');
          result = {
            path: params.path,
            success: true,
            bytesWritten: params.content.length
          };
        } catch (error) {
          auditLog(clientIP, action, 'err', String(error));
          return res.status(500).json({
            ok: false,
            error: { code: 'WRITE_FAILED', message: `Unable to write file: ${error}` }
          });
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
          auditLog(clientIP, action, 'err', 'Missing table name');
          return res.status(400).json({
            ok: false,
            error: { code: 'MISSING_TABLE', message: 'Missing table name' }
          });
        }
        
        // Block raw SQL injection
        if (params.table.includes(';') || params.table.includes('--') || params.where?.includes(';')) {
          auditLog(clientIP, action, 'err', 'SQL injection attempt blocked');
          return res.status(403).json({
            ok: false,
            error: { code: 'SQL_BLOCKED', message: 'Raw SQL not allowed' }
          });
        }
        
        try {
          const limit = Math.min(params.limit || 10, 100); // Cap at 100
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
          auditLog(clientIP, action, 'err', String(error));
          return res.status(500).json({
            ok: false,
            error: { code: 'DB_ERROR', message: `Database query failed: ${error}` }
          });
        }
        break;
        
      case 'runCommand':
        if (!params?.name) {
          auditLog(clientIP, action, 'err', 'Missing command name');
          return res.status(400).json({
            ok: false,
            error: { code: 'MISSING_COMMAND', message: 'Missing command name' }
          });
        }
        
        const allowedCommands = [
          'npm run build',
          'npx prisma migrate status',
          'npx prisma db pull'
        ];
        
        if (!allowedCommands.includes(params.name)) {
          auditLog(clientIP, action, 'err', 'Command not in allowlist');
          return res.status(403).json({
            ok: false,
            error: { code: 'COMMAND_BLOCKED', message: 'Command not in allowlist' }
          });
        }
        
        try {
          const output = execSync(params.name, { 
            encoding: 'utf8',
            timeout: 30000,
            cwd: process.cwd()
          });
          result = {
            command: params.name,
            output,
            success: true
          };
        } catch (error: any) {
          auditLog(clientIP, action, 'err', String(error));
          result = {
            command: params.name,
            error: error.message,
            output: error.stdout || '',
            success: false
          };
        }
        break;
        
      case 'getLogs':
        const logType = params?.type || 'qa';
        try {
          if (logType === 'qa') {
            if (fs.existsSync('qa_bridge_audit.log')) {
              const logContent = fs.readFileSync('qa_bridge_audit.log', 'utf8');
              const lines = logContent.split('\n').filter(line => line.trim());
              result = {
                type: 'qa',
                lines: lines.slice(-50), // Last 50 entries
                total: lines.length
              };
            } else {
              result = { type: 'qa', lines: [], total: 0 };
            }
          } else {
            auditLog(clientIP, action, 'err', 'Invalid log type');
            return res.status(400).json({
              ok: false,
              error: { code: 'INVALID_LOG_TYPE', message: 'Invalid log type. Use: qa' }
            });
          }
        } catch (error) {
          auditLog(clientIP, action, 'err', String(error));
          return res.status(500).json({
            ok: false,
            error: { code: 'LOG_ERROR', message: `Failed to get logs: ${error}` }
          });
        }
        break;
        
      case 'qaTests':
        try {
          // Import and run comprehensive QA tests
          const { comprehensiveQA } = await import('../services/qaTests');
          result = await comprehensiveQA.runFullSuite();

          // Cache the report for the live dashboard
          try {
            const { qaReportCache } = await import('../services/qaReportCache');
            qaReportCache.setReport(result);
          } catch (cacheError) {
            console.warn('Failed to cache QA report:', cacheError);
          }
        } catch (error) {
          result = {
            timestamp: new Date().toISOString(),
            totalTests: 1,
            passed: 0,
            failed: 1,
            tests: [{
              name: 'QA Tests Execution',
              status: 'FAIL',
              details: `Failed to execute comprehensive QA tests: ${error}`
            }]
          };
        }
        break;
        
      default:
        auditLog(clientIP, action || 'unknown', 'err', 'Unknown action');
        return res.status(400).json({
          ok: false,
          error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` }
        });
    }
    
    auditLog(clientIP, action, 'ok');
    const truncatedResult = truncateResponse({ ok: true, data: result });
    res.json(truncatedResult);
    
  } catch (error) {
    auditLog(clientIP, action || 'unknown', 'err', String(error));
    res.status(500).json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: `Bridge error: ${error}` }
    });
  }
}