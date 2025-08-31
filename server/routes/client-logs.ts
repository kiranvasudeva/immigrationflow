/**
 * CLIENT LOGS ENDPOINT
 * Receives and processes client-side logs for debugging
 */

import { Router } from 'express';
import { logger } from '../middleware/logger';

const router = Router();

interface ClientLogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'i18n' | 'network' | 'state' | 'error' | 'performance' | 'user';
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
}

interface ClientLogsRequest {
  events: ClientLogEvent[];
}

// Endpoint to receive client-side logs
router.post('/api/client-logs', (req, res) => {
  try {
    const { events }: ClientLogsRequest = req.body;
    
    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events array' });
    }

    // Process each log event
    events.forEach((event) => {
      const logMessage = `[CLIENT-${event.category.toUpperCase()}] ${event.message}`;
      const logData = {
        ...event.data,
        timestamp: event.timestamp,
        userAgent: event.userAgent,
        url: event.url,
        ...(event.stack && { stack: event.stack })
      };

      // Log with appropriate level
      switch (event.level) {
        case 'error':
          logger.error(logMessage, logData);
          break;
        case 'warn':
          logger.warn(logMessage, logData);
          break;
        case 'debug':
          logger.debug(logMessage, logData);
          break;
        case 'info':
        default:
          logger.info(logMessage, logData);
          break;
      }
    });

    res.status(200).json({ 
      received: events.length,
      message: 'Logs processed successfully' 
    });
    
  } catch (error) {
    const err = error as Error;
    logger.error('Error processing client logs', { error: err.message });
    res.status(500).json({ error: 'Failed to process logs' });
  }
});

// Health check endpoint for client logging
router.get('/api/client-logs/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Client logging endpoint is healthy'
  });
});

export { router as clientLogsRouter };