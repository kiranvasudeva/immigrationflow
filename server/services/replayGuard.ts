// Replay protection service for QA Bridge
interface NonceEntry {
  timestamp: number;
  ttl: number;
}

class ReplayGuard {
  private nonceCache = new Map<string, NonceEntry>();
  private readonly NONCE_TTL_SEC: number;
  private readonly CLOCK_SKEW_SEC: number;

  constructor() {
    this.NONCE_TTL_SEC = parseInt(process.env.BRIDGE_NONCE_TTL_SEC || '300'); // 5 minutes
    this.CLOCK_SKEW_SEC = parseInt(process.env.BRIDGE_CLOCK_SKEW_SEC || '30'); // 30 seconds
    
    // Cleanup expired nonces every minute
    setInterval(() => this.cleanup(), 60000);
  }

  validateRequest(timestamp: string, nonce: string): { valid: boolean; error?: string } {
    // Validate timestamp format
    const ts = parseInt(timestamp);
    if (isNaN(ts)) {
      return { valid: false, error: 'Invalid timestamp format' };
    }

    // Check clock skew
    const now = Date.now();
    const diff = Math.abs(now - ts);
    if (diff > this.CLOCK_SKEW_SEC * 1000) {
      return { valid: false, error: 'Timestamp outside allowed window' };
    }

    // Check nonce format (should be UUID)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nonce)) {
      return { valid: false, error: 'Invalid nonce format' };
    }

    // Check for replay
    if (this.nonceCache.has(nonce)) {
      return { valid: false, error: 'Nonce already used' };
    }

    // Store nonce
    this.nonceCache.set(nonce, {
      timestamp: now,
      ttl: now + (this.NONCE_TTL_SEC * 1000)
    });

    return { valid: true };
  }

  private cleanup(): void {
    const now = Date.now();
    this.nonceCache.forEach((entry, nonce) => {
      if (now > entry.ttl) {
        this.nonceCache.delete(nonce);
      }
    });
  }
}

export const replayGuard = new ReplayGuard();