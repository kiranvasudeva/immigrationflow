import pino from 'pino';
import pinoHttp from 'pino-http';

// PII patterns to scrub from logs
const PII_PATTERNS = [
  // Email patterns
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
  // Phone numbers (Romanian format)
  /(\+40|0040|0)([7-9]\d{8})/g,
  // Romanian CNP (Personal Numeric Code)
  /\b\d{13}\b/g,
  // Passport numbers (alphanumeric 6-9 chars)
  /\b[A-Z0-9]{6,9}\b/g,
  // Credit card patterns
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

// Sensitive field names that should be redacted
const SENSITIVE_FIELDS = [
  'password', 'pwd', 'secret', 'token', 'key', 'auth',
  'email', 'phone', 'cnp', 'passport', 'ssn', 'tax_id',
  'credit_card', 'card_number', 'cvv', 'pin'
];

/**
 * Scrub PII from strings
 */
function scrubPII(text: string): string {
  let scrubbed = text;
  
  // Replace PII patterns with placeholders
  PII_PATTERNS.forEach((pattern, index) => {
    scrubbed = scrubbed.replace(pattern, `[PII_REDACTED_${index}]`);
  });
  
  return scrubbed;
}

/**
 * Recursively scrub PII from objects
 */
function scrubObjectPII(obj: any, depth = 0): any {
  if (depth > 10) return '[MAX_DEPTH_REACHED]'; // Prevent infinite recursion
  
  if (typeof obj === 'string') {
    return scrubPII(obj);
  }
  
  if (typeof obj === 'number' || typeof obj === 'boolean' || obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => scrubObjectPII(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const scrubbed: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field name indicates sensitive data
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubObjectPII(value, depth + 1);
      }
    }
    
    return scrubbed;
  }
  
  return obj;
}

// Create main Pino logger
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers: {
    // Custom serializers to scrub PII
    req: (req) => {
      const scrubbed = pino.stdSerializers.req(req);
      return scrubObjectPII(scrubbed);
    },
    res: (res) => {
      const scrubbed = pino.stdSerializers.res(res);
      return scrubObjectPII(scrubbed);
    },
    err: (err) => {
      const scrubbed = pino.stdSerializers.err(err);
      return scrubObjectPII(scrubbed);
    }
  },
  formatters: {
    // Custom formatter to scrub any remaining PII in log messages
    log: (object) => {
      return scrubObjectPII(object);
    }
  },
  ...(process.env.NODE_ENV === 'production' 
    ? {} 
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname'
          }
        }
      }
  )
});

// Pino HTTP middleware for Express
export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => scrubObjectPII(pino.stdSerializers.req(req)),
    res: (res) => scrubObjectPII(pino.stdSerializers.res(res))
  },
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    if (res.statusCode >= 300) return 'info';
    return 'info';
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  // Skip logging for health checks and static assets
  autoLogging: {
    ignore: (req) => {
      return req.url === '/health' || 
             req.url === '/health/db' || 
             req.url?.startsWith('/assets/') ||
             req.url?.startsWith('/locales/');
    }
  }
});

// Export utility functions for other services
export const logInfo = (message: string, data?: any) => {
  logger.info(scrubObjectPII(data), scrubPII(message));
};

export const logWarn = (message: string, data?: any) => {
  logger.warn(scrubObjectPII(data), scrubPII(message));
};

export const logError = (message: string, error?: Error | any, data?: any) => {
  const errorData = error instanceof Error 
    ? { error: error.message, stack: error.stack, ...data }
    : { error: String(error), ...data };
  
  logger.error(scrubObjectPII(errorData), scrubPII(message));
};

export const logDebug = (message: string, data?: any) => {
  logger.debug(scrubObjectPII(data), scrubPII(message));
};

// Create child logger for specific modules
export const createModuleLogger = (module: string) => {
  return logger.child({ module });
};