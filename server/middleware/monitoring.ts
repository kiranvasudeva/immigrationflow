import { Request, Response, NextFunction } from 'express';
import { productionConfig } from '../config/production';

// Structured Logging Middleware
export function createStructuredLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      const logData = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        userId: (req as any).user?.id,
        ...(res.statusCode >= 400 && { error: true })
      };
      
      // Remove sensitive data
      if (req.body?.password) {
        delete req.body.password;
      }
      if (req.headers.authorization) {
        logData.hasAuth = true;
      }
      
      const level = res.statusCode >= 500 ? 'error' : 
                   res.statusCode >= 400 ? 'warn' : 'info';
      
      console.log(JSON.stringify({ level, ...logData }));
    });
    
    next();
  };
}

// Performance Monitoring
export function performanceMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1000000;
      
      // Log slow requests
      if (durationMs > 1000) {
        console.warn(`Slow request detected: ${req.method} ${req.url} took ${durationMs.toFixed(2)}ms`);
      }
      
      // Track memory usage for high-traffic endpoints
      if (req.url.startsWith('/api/')) {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
          console.warn(`High memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    });
    
    next();
  };
}

// Error Tracking Middleware
export function errorTracking() {
  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    const errorData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: productionConfig.NODE_ENV === 'production' ? undefined : error.stack
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query
      },
      user: (req as any).user?.id
    };
    
    console.error(JSON.stringify(errorData));
    
    // Send user-friendly error response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: productionConfig.NODE_ENV === 'production' 
          ? 'Something went wrong. Please try again later.'
          : error.message,
        timestamp: new Date().toISOString()
      });
    }
  };
}

// Health Check Endpoints
export function setupHealthChecks(app: any, storage: any) {
  // Basic health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: productionConfig.NODE_ENV
    });
  });
  
  // Database health check
  app.get('/health/db', async (req: Request, res: Response) => {
    try {
      // Simple database query to check connectivity
      const startTime = Date.now();
      await storage.getAllUsers(); // Use existing method
      const queryTime = Date.now() - startTime;
      
      res.json({
        status: 'healthy',
        database: 'connected',
        queryTime: `${queryTime}ms`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });
}