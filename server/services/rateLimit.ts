// Rate limiting service for QA Bridge
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly RATE_LIMIT: number;
  private readonly WINDOW_MS: number;

  constructor() {
    this.RATE_LIMIT = parseInt(process.env.BRIDGE_RATE || '10'); // 10 requests per minute
    this.WINDOW_MS = 60000; // 1 minute
    
    // Cleanup expired entries every 2 minutes
    setInterval(() => this.cleanup(), 120000);
  }

  checkLimit(key: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new window
      const newEntry = {
        count: 1,
        resetTime: now + this.WINDOW_MS
      };
      this.limits.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.RATE_LIMIT - 1,
        resetTime: newEntry.resetTime
      };
    }

    if (entry.count >= this.RATE_LIMIT) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }

    entry.count++;
    
    return {
      allowed: true,
      remaining: this.RATE_LIMIT - entry.count,
      resetTime: entry.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();
    this.limits.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    });
  }
}

export const rateLimiter = new RateLimiter();