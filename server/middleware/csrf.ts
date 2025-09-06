import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFMiddleware {
  generateToken: (req: Request, res: Response, next: NextFunction) => void;
  verifyToken: (req: Request, res: Response, next: NextFunction) => void;
  skipCSRF: (req: Request, res: Response, next: NextFunction) => void;
}

export function createCSRFMiddleware(): CSRFMiddleware {
  const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-me';

  // Generate CSRF token and set it in cookie + response header
  const generateToken = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.includes('/healthz') || req.path.includes('/dev/')) {
      return next();
    }

    const csrfToken = crypto.randomBytes(32).toString('hex');
    
    // Set CSRF token in non-httpOnly cookie (client needs to read it)
    res.cookie('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    // Also set in response header for easier client access
    res.setHeader('X-CSRF-Token', csrfToken);
    
    // Store token in session for verification
    (req as any).session.csrfToken = csrfToken;
    
    next();
  };

  // Verify CSRF token for unsafe methods
  const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toLowerCase();
    
    // Skip CSRF for safe methods and health checks
    if (['get', 'head', 'options'].includes(method) || 
        req.path.includes('/healthz') || 
        req.path.includes('/dev/')) {
      return next();
    }

    const tokenFromHeader = req.headers['x-csrf-token'] as string;
    const tokenFromCookie = req.cookies['csrf-token'];
    const sessionToken = (req as any).session?.csrfToken;

    // For AUTH_MODE=password, require CSRF protection
    if (process.env.AUTH_MODE === 'password') {
      if (!tokenFromHeader || !tokenFromCookie || !sessionToken) {
        return res.status(403).json({ 
          error: 'CSRF token missing',
          details: 'X-CSRF-Token header and csrf-token cookie required'
        });
      }

      // Verify double-submit pattern: header === cookie === session
      if (tokenFromHeader !== tokenFromCookie || tokenFromCookie !== sessionToken) {
        return res.status(403).json({ 
          error: 'CSRF token mismatch',
          details: 'Token validation failed'
        });
      }
    }

    next();
  };

  // Skip CSRF for specific routes (mainly for dev/testing)
  const skipCSRF = (req: Request, res: Response, next: NextFunction) => {
    next();
  };

  return {
    generateToken,
    verifyToken,
    skipCSRF,
  };
}

// Export configured middleware
export const csrfMiddleware = createCSRFMiddleware();