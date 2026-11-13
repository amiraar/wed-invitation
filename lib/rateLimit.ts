import { createHash } from 'node:crypto';
import { sql } from '@/lib/db';
import { logSecurityEvent } from '@/lib/securityLog';

type RateLimitResult = { success: boolean; remaining: number; resetAt: number };

// Counters live in Postgres (rate_limits), so every Vercel instance and every cold start shares
// them. One atomic upsert per request: a new window starts at 1 once the old one has expired.
export function rateLimit(config: { windowMs: number; max: number }) {
  return async (key: string): Promise<RateLimitResult> => {
    const hashed = createHash('sha256').update(key).digest('hex');
    try {
      const rows = await sql<{ count: number; reset_at: string }>`
        INSERT INTO rate_limits (key, count, reset_at)
        VALUES (${hashed}, 1, NOW() + make_interval(secs => ${config.windowMs / 1000}))
        ON CONFLICT (key) DO UPDATE SET
          count = CASE WHEN rate_limits.reset_at <= NOW() THEN 1 ELSE rate_limits.count + 1 END,
          reset_at = CASE WHEN rate_limits.reset_at <= NOW() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
        RETURNING count, reset_at
      `;
      // Old rows are only clutter; clear them now and then.
      if (Math.random() < 0.02) await sql`DELETE FROM rate_limits WHERE reset_at < NOW() - INTERVAL '1 day'`;
      const count = Number(rows[0].count);
      return {
        success: count <= config.max,
        remaining: Math.max(0, config.max - count),
        resetAt: new Date(rows[0].reset_at).getTime()
      };
    } catch {
      // Fail open: a database hiccup must not lock the admin or guests out.
      logSecurityEvent('rate_limit_unavailable');
      return { success: true, remaining: config.max, resetAt: Date.now() + config.windowMs };
    }
  };
}
