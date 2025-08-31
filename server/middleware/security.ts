import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { productionConfig } from '../config/production';

// Security Headers Middleware
export function setupSecurityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.replit.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  });
}

// Rate Limiting Middleware
export const createRateLimiter = () => rateLimit({
  windowMs: productionConfig.RATE_LIMIT_WINDOW_MS,
  max: productionConfig.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: productionConfig.RATE_LIMIT_WINDOW_MS / 1000
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/health/db';
  }
});

// Input Validation & Sanitization
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Remove potential XSS vectors
  const cleanInput = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        cleaned[key] = cleanInput(obj[key]);
      }
      return cleaned;
    }
    return obj;
  };

  if (req.body) {
    req.body = cleanInput(req.body);
  }
  if (req.query) {
    req.query = cleanInput(req.query);
  }
  if (req.params) {
    req.params = cleanInput(req.params);
  }

  next();
}

// CORS Configuration
export function setupCORS() {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = productionConfig.ALLOWED_ORIGINS;
    
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin || '')) {
      res.header('Access-Control-Allow-Origin', origin);
    } else if (productionConfig.NODE_ENV !== 'production') {
      res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  };
}

// Emergency Admin Access (with expiration)
export function createEmergencyAdminAccess() {
  const emergencyToken = process.env.EMERGENCY_ADMIN_TOKEN;
  const emergencyExpiry = process.env.EMERGENCY_ADMIN_EXPIRY;
  
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Emergency ')) {
      const token = authHeader.slice('Emergency '.length);
      
      if (token === emergencyToken) {
        if (emergencyExpiry && new Date() > new Date(emergencyExpiry)) {
          return res.status(401).json({ error: 'Emergency access token expired' });
        }
        
        // Grant admin access
        req.user = {
          id: 'emergency-admin',
          role: 'ADMIN',
          email: 'emergency@system.local'
        };
        return next();
      }
    }
    
    next();
  };
}