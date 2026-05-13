type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

function cleanupExpired(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
  lastCleanup = now;
}

export function rateLimit(config: { windowMs: number; max: number }) {
  return (ip: string): { success: boolean; remaining: number; resetAt: number } => {
    const now = Date.now();
    cleanupExpired(now);

    const existing = store.get(ip);
    if (!existing || existing.resetAt <= now) {
      const resetAt = now + config.windowMs;
      store.set(ip, { count: 1, resetAt });
      return { success: true, remaining: config.max - 1, resetAt };
    }

    if (existing.count >= config.max) {
      return { success: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    store.set(ip, existing);
    return { success: true, remaining: config.max - existing.count, resetAt: existing.resetAt };
  };
}
