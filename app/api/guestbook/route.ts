import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, getClientIp } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { GuestbookSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { GuestbookItem } from '@/lib/types';

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });
const TTL_MS = 30 * 1000;

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (auth) {
    const rows = await sql<GuestbookItem>`
      SELECT id, name, message, is_approved, created_at
      FROM guestbook
      ORDER BY created_at DESC
    `;
    return jsonSuccess(rows);
  }

  const cached = getCache<GuestbookItem[]>(CACHE_KEYS.GUESTBOOK_PUBLIC);
  if (cached) return jsonSuccess(cached);

  const rows = await sql<GuestbookItem>`
    SELECT id, name, message, is_approved, created_at
    FROM guestbook
    WHERE is_approved = TRUE
    ORDER BY created_at DESC
  `;

  setCache(CACHE_KEYS.GUESTBOOK_PUBLIC, rows, TTL_MS);
  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = limiter(ip);
  if (!limit.success) {
    return jsonError('Message submission limit reached. Please try again later.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = GuestbookSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  const payload = parsed.data;
  await sql`
    INSERT INTO guestbook (name, message, is_approved, ip_address)
    VALUES (
      ${sanitizeText(payload.name)},
      ${sanitizeText(payload.message)},
      FALSE,
      ${ip}
    )
  `;

  return jsonSuccess({ submitted: true });
}
