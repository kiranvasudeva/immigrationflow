// Client Error Reporter - Automatic error sending to server logs
interface ErrorReport {
  timestamp: string;
  userAgent: string;
  url: string;
  error: {
    message: string;
    stack?: string;
    name: string;
  };
  user?: {
    id?: string;
    role?: string;
  };
  context?: Record<string, any>;
}

interface StateChange {
  timestamp: string;
  component: string;
  oldState: any;
  newState: any;
  trigger: string;
}

interface NetworkLog {
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  request?: any;
  response?: any;
  error?: string;
}

interface TranslationLog {
  timestamp: string;
  key: string;
  language: string;
  result: string;
  fallback?: boolean;
  error?: string;
}

interface PerformanceLog {
  timestamp: string;
  metric: string;
  value: number;
  context?: Record<string, any>;
}

class ClientErrorReporter {
  private logs: {
    errors: ErrorReport[];
    stateChanges: StateChange[];
    network: NetworkLog[];
    translations: TranslationLog[];
    performance: PerformanceLog[];
  } = {
    errors: [],
    stateChanges: [],
    network: [],
    translations: [],
    performance: []
  };

  private user: { id?: string; role?: string } | null = null;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.setupErrorHandlers();
    this.setupNetworkMonitor();
    this.setupPerformanceMonitor();
    this.startAutoFlush();
  }

  setUser(user: { id?: string; role?: string } | null) {
    this.user = user;
  }

  // Error reporting
  private setupErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.logError(event.error, 'Global Error Handler', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, 'Unhandled Promise Rejection');
    });
  }

  logError(error: Error | any, context: string, additionalContext?: Record<string, any>) {
    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: {
        message: error?.message || String(error),
        stack: error?.stack,
        name: error?.name || 'Unknown'
      },
      user: this.user || undefined,
      context: { source: context, ...additionalContext }
    };

    this.logs.errors.push(errorReport);
    console.error(`[CLIENT ERROR] ${context}:`, error);
  }

  // State change logging
  logStateChange(component: string, oldState: any, newState: any, trigger: string) {
    const stateChange: StateChange = {
      timestamp: new Date().toISOString(),
      component,
      oldState,
      newState,
      trigger
    };

    this.logs.stateChanges.push(stateChange);
    console.debug(`[STATE CHANGE] ${component}:`, { oldState, newState, trigger });
  }

  // Network monitoring
  private setupNetworkMonitor() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const [url, options] = args;
      const method = options?.method || 'GET';

      let networkLog: NetworkLog = {
        timestamp: new Date().toISOString(),
        method,
        url: typeof url === 'string' ? url : url.toString(),
        request: options?.body ? this.sanitizeData(options.body) : undefined
      };

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        networkLog.status = response.status;
        networkLog.duration = endTime - startTime;
        
        // Clone response to read body without consuming it
        const responseClone = response.clone();
        try {
          const responseText = await responseClone.text();
          networkLog.response = this.sanitizeData(responseText);
        } catch (e) {
          // Ignore response body read errors
        }

        this.logs.network.push(networkLog);
        console.debug(`[NETWORK] ${method} ${networkLog.url} - ${response.status} (${networkLog.duration?.toFixed(2)}ms)`);
        
        return response;
      } catch (error) {
        const endTime = performance.now();
        networkLog.duration = endTime - startTime;
        networkLog.error = (error as Error).message;
        
        this.logs.network.push(networkLog);
        console.error(`[NETWORK ERROR] ${method} ${networkLog.url}:`, error);
        throw error;
      }
    };
  }

  // Translation debugging
  logTranslation(key: string, language: string, result: string, fallback?: boolean, error?: string) {
    const translationLog: TranslationLog = {
      timestamp: new Date().toISOString(),
      key,
      language,
      result,
      fallback,
      error
    };

    this.logs.translations.push(translationLog);
    if (error) {
      console.warn(`[TRANSLATION ERROR] ${key} (${language}):`, error);
    } else if (fallback) {
      console.warn(`[TRANSLATION FALLBACK] ${key} (${language}) -> ${result}`);
    } else {
      console.debug(`[TRANSLATION] ${key} (${language}) -> ${result}`);
    }
  }

  // Performance tracking
  private setupPerformanceMonitor() {
    // Monitor page load
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.logPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
      this.logPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
      this.logPerformance('first_paint', navigation.responseEnd - navigation.fetchStart);
    });
  }

  logPerformance(metric: string, value: number, context?: Record<string, any>) {
    const performanceLog: PerformanceLog = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      context
    };

    this.logs.performance.push(performanceLog);
    console.debug(`[PERFORMANCE] ${metric}: ${value}ms`, context);
  }

  // Auto-flush logs to server
  private startAutoFlush() {
    this.flushInterval = setInterval(() => {
      this.flushLogs();
    }, 10000); // Flush every 10 seconds
  }

  private async flushLogs() {
    if (this.isEmpty()) return;

    const logsToSend = { ...this.logs };
    this.clearLogs();

    try {
      const response = await fetch('/api/client-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          user: this.user,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        console.error('Failed to send logs to server:', response.status);
        // Put logs back if sending failed
        Object.keys(logsToSend).forEach(key => {
          this.logs[key as keyof typeof this.logs].unshift(...logsToSend[key as keyof typeof logsToSend]);
        });
      }
    } catch (error) {
      console.error('Error sending logs to server:', error);
      // Put logs back if sending failed
      Object.keys(logsToSend).forEach(key => {
        this.logs[key as keyof typeof this.logs].unshift(...logsToSend[key as keyof typeof logsToSend]);
      });
    }
  }

  private isEmpty(): boolean {
    return Object.values(this.logs).every(arr => arr.length === 0);
  }

  private clearLogs() {
    this.logs = {
      errors: [],
      stateChanges: [],
      network: [],
      translations: [],
      performance: []
    };
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return this.sanitizeObject(parsed);
      } catch {
        return data.length > 1000 ? data.substring(0, 1000) + '...' : data;
      }
    }
    return this.sanitizeObject(data);
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      // Remove sensitive data
      if (['password', 'token', 'secret', 'key'].some(sensitive => 
        key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = this.sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushLogs(); // Final flush
  }
}

export const clientErrorReporter = new ClientErrorReporter();