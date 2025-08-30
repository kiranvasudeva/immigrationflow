import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { logger, httpLogger, logInfo, logError } from "./services/loggingService";
import { httpMetricsMiddleware, getMetrics, initializeMetrics } from "./services/metricsService";
import { register } from 'prom-client';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add Pino HTTP logging middleware
app.use(httpLogger);

// Add Prometheus metrics middleware
app.use(httpMetricsMiddleware());

(async () => {
  try {
    // Verify environment variables before starting
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    // Initialize metrics collection
    initializeMetrics();
    logInfo("Starting server initialization...");
    
    const server = await registerRoutes(app);
    logInfo("Routes registered successfully");

    // Add Prometheus metrics endpoint
    app.get('/metrics', async (req, res) => {
      try {
        const metrics = await getMetrics();
        res.set('Content-Type', register.contentType);
        res.end(metrics);
      } catch (error) {
        logError('Failed to generate metrics', error);
        res.status(500).json({ error: 'Failed to generate metrics' });
      }
    });

    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    
    // Add database health check endpoint
    app.get('/health/db', async (req, res) => {
      try {
        // Import storage here to avoid circular dependencies
        const { storage } = await import('./storage');
        // Simple database connectivity test
        await storage.getAllStages();
        res.status(200).json({ 
          status: 'ok', 
          database: 'connected',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logError('Database health check failed', error);
        res.status(503).json({ 
          status: 'error', 
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Serve translation files before Vite takes over
    app.use('/locales', express.static(path.resolve(import.meta.dirname, '..', 'public', 'locales')));

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      logError(`HTTP Error: ${status} - ${message}`);
      res.status(status).json({ message });
      
      // Don't re-throw the error to prevent crashes
      if (status >= 500) {
        logError('Server error details', err);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      logInfo("Vite development server setup complete");
    } else {
      serveStatic(app);
      logInfo("Static file serving setup complete");
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      logInfo(`Server successfully started and listening on host 0.0.0.0:${port}`);
      logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logInfo(`Health check available at /health`);
      logInfo(`Database health check available at /health/db`);
    });
    
    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logError(`Port ${port} is already in use. Server startup failed.`);
        process.exit(1);
      } else {
        logError('Server error', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    logError('Failed to start server', error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace', new Error(error.stack));
    }
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError(`Unhandled Rejection at: ${String(promise)} reason: ${String(reason)}`);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logInfo('Received SIGINT, shutting down gracefully...');
  await performGracefulShutdown();
});

process.on('SIGTERM', async () => {
  logInfo('Received SIGTERM, shutting down gracefully...');
  await performGracefulShutdown();
});

async function performGracefulShutdown() {
  try {
    // Shutdown queues first
    const { gracefulShutdown: shutdownQueues } = await import('./workers/queue');
    await shutdownQueues();
    
    logInfo('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logError('Error during graceful shutdown', error);
    process.exit(1);
  }
}
