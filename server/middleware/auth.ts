import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Capture original end method
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    // Log the request after response is sent
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const ip = req.ip || req.connection.remoteAddress;
    
    auditService.logUserAction(
      userId,
      `${req.method} ${req.path}`,
      'API_REQUEST',
      req.path,
      ip,
      {
        method: req.method,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      }
    );
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};
