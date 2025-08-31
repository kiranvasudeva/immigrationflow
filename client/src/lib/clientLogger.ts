/**
 * CLIENT-SIDE LOGGING SYSTEM
 * Sends all client-side events, errors, and state changes to server for debugging
 */

interface LogEvent {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'i18n' | 'network' | 'state' | 'error' | 'performance' | 'user';
  message: string;
  data?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
}

class ClientLogger {
  private queue: LogEvent[] = [];
  private isFlushingQueue = false;
  private maxQueueSize = 50;
  private flushInterval = 2000; // 2 seconds

  constructor() {
    // Start auto-flushing
    setInterval(() => this.flushQueue(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flushQueue(true));
    
    // Capture global errors
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.error('Global JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack
      });
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  private createLogEvent(
    level: LogEvent['level'],
    category: LogEvent['category'],
    message: string,
    data?: any,
    stack?: string
  ): LogEvent {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  // Public logging methods
  info(category: LogEvent['category'], message: string, data?: any) {
    this.addToQueue('info', category, message, data);
  }

  warn(category: LogEvent['category'], message: string, data?: any) {
    this.addToQueue('warn', category, message, data);
  }

  error(message: string, data?: any, stack?: string) {
    this.addToQueue('error', 'error', message, data, stack);
  }

  debug(category: LogEvent['category'], message: string, data?: any) {
    this.addToQueue('debug', category, message, data);
  }

  // I18n specific logging
  i18n(message: string, data?: any) {
    this.addToQueue('info', 'i18n', message, data);
  }

  // Network specific logging
  network(message: string, data?: any) {
    this.addToQueue('info', 'network', message, data);
  }

  // State change logging
  stateChange(component: string, oldState: any, newState: any) {
    this.addToQueue('debug', 'state', `State change in ${component}`, {
      component,
      oldState,
      newState,
      timestamp: Date.now()
    });
  }

  // Performance logging
  performance(metric: string, value: number, data?: any) {
    this.addToQueue('info', 'performance', `Performance: ${metric}`, {
      metric,
      value,
      ...data
    });
  }

  // User interaction logging
  userAction(action: string, data?: any) {
    this.addToQueue('info', 'user', `User action: ${action}`, data);
  }

  private addToQueue(
    level: LogEvent['level'],
    category: LogEvent['category'],
    message: string,
    data?: any,
    stack?: string
  ) {
    const event = this.createLogEvent(level, category, message, data, stack);
    this.queue.push(event);

    // Immediate flush for errors
    if (level === 'error') {
      this.flushQueue();
    }

    // Prevent queue overflow
    if (this.queue.length >= this.maxQueueSize) {
      this.flushQueue();
    }
  }

  private async flushQueue(sync = false) {
    if (this.isFlushingQueue || this.queue.length === 0) return;

    this.isFlushingQueue = true;
    const events = [...this.queue];
    this.queue = [];

    try {
      const method = sync ? 'sendBeacon' : 'fetch';
      
      if (sync && navigator.sendBeacon) {
        // Use sendBeacon for page unload (more reliable)
        navigator.sendBeacon(
          '/api/client-logs',
          JSON.stringify({ events })
        );
      } else {
        // Use fetch for normal operation
        await fetch('/api/client-logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
          ...(sync ? {} : { keepalive: true })
        });
      }
    } catch (error) {
      // Re-add events to queue if sending failed
      this.queue.unshift(...events);
      console.warn('Failed to send logs to server:', error);
    }

    this.isFlushingQueue = false;
  }

  // Force immediate flush
  flush() {
    return this.flushQueue();
  }
}

// Create singleton instance
export const clientLogger = new ClientLogger();

// Development helper
if (import.meta.env.DEV) {
  (window as any).__clientLogger = clientLogger;
}