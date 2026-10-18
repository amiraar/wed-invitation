import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, getClientIp } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { getCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { GuestWishSchema } from '@/lib/validations';
import { decodeText, sanitizeText } from '@/lib/sanitize';
import { getGuestByToken } from '@/lib/guests';
import { moderateMessage } from '@/lib/moderation';
import type { GuestbookItem } from '@/lib/types';

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });
const tokenLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 3 });
const TTL_MS = 30 * 1000;

const MODERATION_ERRORS = {
  link: "Links aren't allowed in wishes. Please remove them and try again.",
  profanity: 'Please keep your message kind and polite.'
} as const;

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (auth) {
    const rows = await sql<GuestbookItem>`
      SELECT id, name, message, is_approved, is_anonymous, created_at
      FROM guestbook
      ORDER BY created_at DESC
    `;
    return jsonSuccess(rows.map((row) => ({ ...row, name: decodeText(row.name), message: decodeText(row.message) })));
  }

  const cached = getCache<GuestbookItem[]>(CACHE_KEYS.GUESTBOOK_PUBLIC);
  if (cached) return jsonSuccess(cached);

  // Guests who hid their name are shown as "Someone"; the real name never leaves the server.
  const rows = await sql<GuestbookItem>`
    SELECT id, CASE WHEN is_anonymous THEN 'Someone' ELSE name END AS name, message, is_approved, created_at
    FROM guestbook
    WHERE is_approved = TRUE
    ORDER BY created_at DESC
  `;

  setCache(CACHE_KEYS.GUESTBOOK_PUBLIC, rows, TTL_MS);
  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = limiter(`guestbook:${ip}`);
  if (!limit.success) {
    return jsonError('Message submission limit reached. Please try again later.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = GuestWishSchema.safeParse(body);
  if (!parsed.success) return jsonError('Your message must be between 5 and 1000 characters.', 400);

  const payload = parsed.data;
  if (!tokenLimiter(`guestbook-token:${payload.token}`).success) {
    return jsonError('Message submission limit reached. Please try again later.', 429);
  }

  const guest = await getGuestByToken(payload.token);
  if (!guest) return jsonError('Invitation not found.', 404);

  const moderation = moderateMessage(payload.message);
  if (!moderation.ok) return jsonError(MODERATION_ERRORS[moderation.reason], 400);

  // The name comes from the guest list, never from the request.
  await sql`
    INSERT INTO guestbook (guest_id, name, message, is_anonymous, is_approved)
    SELECT g.id, g.name, ${sanitizeText(payload.message)}, ${payload.is_anonymous}, FALSE
    FROM guests g WHERE g.id = ${guest.id}
  `;

  return jsonSuccess({ submitted: true });
}
