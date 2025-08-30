import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import { createModuleLogger } from './loggingService';

const logger = createModuleLogger('metrics');

// Enable default metrics collection (memory, CPU, etc.)
collectDefaultMetrics({
  register,
  prefix: 'immigration_flow_',
});

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'immigration_flow_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDuration = new Histogram({
  name: 'immigration_flow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// Queue Metrics
export const queueDepth = new Gauge({
  name: 'immigration_flow_queue_depth',
  help: 'Number of jobs waiting in the queue',
  labelNames: ['queue_name'],
  registers: [register]
});

export const jobsProcessedTotal = new Counter({
  name: 'immigration_flow_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['queue_name', 'job_type', 'status'],
  registers: [register]
});

export const jobProcessingDuration = new Histogram({
  name: 'immigration_flow_job_processing_duration_seconds',
  help: 'Duration of job processing in seconds',
  labelNames: ['queue_name', 'job_type'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [register]
});

// PDF Generation Metrics
export const pdfsGeneratedTotal = new Counter({
  name: 'immigration_flow_pdfs_generated_total',
  help: 'Total number of PDFs generated',
  labelNames: ['template_type', 'status'],
  registers: [register]
});

export const pdfGenerationDuration = new Histogram({
  name: 'immigration_flow_pdf_generation_duration_seconds',
  help: 'Duration of PDF generation in seconds',
  labelNames: ['template_type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register]
});

// File Upload Metrics
export const fileUploadsTotal = new Counter({
  name: 'immigration_flow_file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['file_type', 'status'],
  registers: [register]
});

export const fileUploadSize = new Histogram({
  name: 'immigration_flow_file_upload_size_bytes',
  help: 'Size of uploaded files in bytes',
  labelNames: ['file_type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760, 104857600], // 1KB to 100MB
  registers: [register]
});

// Database Metrics
export const databaseQueriesTotal = new Counter({
  name: 'immigration_flow_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status'],
  registers: [register]
});

export const databaseQueryDuration = new Histogram({
  name: 'immigration_flow_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register]
});

// Business Logic Metrics
export const activeAssignments = new Gauge({
  name: 'immigration_flow_active_assignments',
  help: 'Number of active assignments',
  registers: [register]
});

export const clientsTotal = new Gauge({
  name: 'immigration_flow_clients_total',
  help: 'Total number of clients',
  registers: [register]
});

export const workersTotal = new Gauge({
  name: 'immigration_flow_workers_total',
  help: 'Total number of workers',
  registers: [register]
});

// Authentication Metrics
export const authAttemptsTotal = new Counter({
  name: 'immigration_flow_auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status'],
  registers: [register]
});

export const activeSessions = new Gauge({
  name: 'immigration_flow_active_sessions',
  help: 'Number of active user sessions',
  registers: [register]
});

// Error Metrics
export const errorsTotal = new Counter({
  name: 'immigration_flow_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'module'],
  registers: [register]
});

/**
 * Middleware to collect HTTP metrics
 */
export function httpMetricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.path || 'unknown';
      const method = req.method;
      const statusCode = res.statusCode.toString();
      
      // Record metrics
      httpRequestsTotal.inc({ method, route, status_code: statusCode });
      httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
      
      // Log error metrics for 4xx and 5xx responses
      if (res.statusCode >= 400) {
        const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
        errorsTotal.inc({ type: errorType, module: 'http' });
      }
    });
    
    next();
  };
}

/**
 * Update queue depth metrics
 */
export async function updateQueueMetrics(queueName: string, depth: number) {
  queueDepth.set({ queue_name: queueName }, depth);
}

/**
 * Record job processing metrics
 */
export function recordJobMetrics(queueName: string, jobType: string, status: 'completed' | 'failed', duration?: number) {
  jobsProcessedTotal.inc({ queue_name: queueName, job_type: jobType, status });
  
  if (duration !== undefined) {
    jobProcessingDuration.observe({ queue_name: queueName, job_type: jobType }, duration / 1000);
  }
}

/**
 * Record PDF generation metrics
 */
export function recordPdfMetrics(templateType: string, status: 'success' | 'error', duration?: number) {
  pdfsGeneratedTotal.inc({ template_type: templateType, status });
  
  if (duration !== undefined && status === 'success') {
    pdfGenerationDuration.observe({ template_type: templateType }, duration / 1000);
  }
}

/**
 * Record file upload metrics
 */
export function recordFileUploadMetrics(fileType: string, status: 'success' | 'error', fileSize?: number) {
  fileUploadsTotal.inc({ file_type: fileType, status });
  
  if (fileSize !== undefined && status === 'success') {
    fileUploadSize.observe({ file_type: fileType }, fileSize);
  }
}

/**
 * Record database query metrics
 */
export function recordDatabaseMetrics(operation: string, table: string, status: 'success' | 'error', duration?: number) {
  databaseQueriesTotal.inc({ operation, table, status });
  
  if (duration !== undefined) {
    databaseQueryDuration.observe({ operation, table }, duration / 1000);
  }
}

/**
 * Record authentication metrics
 */
export function recordAuthMetrics(method: string, status: 'success' | 'failure') {
  authAttemptsTotal.inc({ method, status });
}

/**
 * Update business metrics
 */
export function updateBusinessMetrics(clients: number, workers: number, assignments: number) {
  clientsTotal.set(clients);
  workersTotal.set(workers);
  activeAssignments.set(assignments);
}

/**
 * Record error metrics
 */
export function recordErrorMetrics(type: string, module: string) {
  errorsTotal.inc({ type, module });
}

/**
 * Get metrics in Prometheus format
 */
export async function getMetrics(): Promise<string> {
  try {
    return await register.metrics();
  } catch (error) {
    logger.error('Failed to collect metrics', { error });
    throw error;
  }
}

/**
 * Initialize metrics collection
 */
export function initializeMetrics() {
  logger.info('Metrics collection initialized');
  
  // Set up periodic business metrics updates
  setInterval(async () => {
    try {
      // This would be replaced with actual database queries
      // For now, we'll just log that metrics are being collected
      logger.debug('Updating business metrics');
    } catch (error) {
      logger.error('Failed to update business metrics', { error });
    }
  }, 60000); // Update every minute
}