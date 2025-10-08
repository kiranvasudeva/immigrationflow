import { z } from 'zod';

// Production Environment Configuration Schema
const ProductionConfigSchema = z.object({
  // Database Configuration
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(50).default(10),
  DATABASE_TIMEOUT_MS: z.coerce.number().min(1000).default(30000),
  
  // Security Configuration  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters').optional(),
  
  // Server Configuration
  PORT: z.coerce.number().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['production', 'staging', 'development']).default('development'),
  
  // External Services
  REDIS_URL: z.string().url().optional(),
  EMAIL_SERVICE_API_KEY: z.string().optional(),
  
  // Romanian Government APIs
  IGI_API_ENDPOINT: z.string().url().optional(),
  IGI_API_KEY: z.string().optional(),
  AJOFM_API_ENDPOINT: z.string().url().optional(),
  AJOFM_API_KEY: z.string().optional(),
  
  // File Storage
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('documents'),
  
  // Monitoring & Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // CORS Configuration
  ALLOWED_ORIGINS: z.string().transform(str => str.split(',')).default(''),
  
  // Feature Flags
  ENABLE_AUDIT_LOGGING: z.coerce.boolean().default(true),
  ENABLE_FILE_SCANNING: z.coerce.boolean().default(true),
  ENABLE_GOVERNMENT_API_INTEGRATION: z.coerce.boolean().default(false),
});

export type ProductionConfig = z.infer<typeof ProductionConfigSchema>;

export function validateProductionConfig(): ProductionConfig {
  try {
    const config = ProductionConfigSchema.parse(process.env);
    
    // In development, provide defaults for missing optional fields
    if (config.NODE_ENV === 'development') {
      return {
        ...config,
        JWT_SECRET: config.JWT_SECRET || 'dev-jwt-secret-32-characters-long-minimum',
        ENCRYPTION_KEY: config.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long-min',
        SESSION_SECRET: config.SESSION_SECRET || 'dev-session-secret-32-chars-long-min',
      };
    }
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingFields = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      console.error('❌ Production configuration validation failed:');
      missingFields.forEach(field => console.error(`  • ${field}`));
      
      // Only exit in production, provide defaults in development
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
    throw error;
  }
}

export const productionConfig = validateProductionConfig();
