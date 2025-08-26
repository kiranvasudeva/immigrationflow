import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Verify environment variables before starting
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    log("Starting server initialization...");
    
    const server = await registerRoutes(app);
    log("Routes registered successfully");

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
        log('Database health check failed:', error instanceof Error ? error.message : String(error));
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
      
      log(`Error: ${status} - ${message}`);
      res.status(status).json({ message });
      
      // Don't re-throw the error to prevent crashes
      if (status >= 500) {
        log('Server error details:', err);
      }
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
      log("Vite development server setup complete");
    } else {
      serveStatic(app);
      log("Static file serving setup complete");
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
      log(`Server successfully started and listening on host 0.0.0.0:${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`Health check available at /health`);
      log(`Database health check available at /health/db`);
    });
    
    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Port ${port} is already in use. Server startup failed.`);
        process.exit(1);
      } else {
        log('Server error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
    
  } catch (error) {
    log('Failed to start server:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      log('Stack trace:', error.stack);
    }
    process.exit(1);
  }
})();

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  log('Uncaught Exception:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${String(promise)} reason: ${String(reason)}`);
  process.exit(1);
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});
