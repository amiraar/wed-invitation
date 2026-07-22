import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { EventSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { EventItem } from '@/lib/types';

const TTL_MS = 60 * 1000;

export async function GET() {
  const cached = getCache<EventItem[]>(CACHE_KEYS.EVENTS);
  if (cached) return jsonSuccess(cached);

  const rows = await sql<EventItem>`
    SELECT * FROM events ORDER BY order_index ASC
  `;
  setCache(CACHE_KEYS.EVENTS, rows, TTL_MS);
  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  const payload = parsed.data;
  const eventDate = payload.event_date && payload.event_date.length > 0 ? payload.event_date : null;
  const timeStart = payload.time_start && payload.time_start.length > 0 ? payload.time_start : null;
  const timeEnd = payload.time_end && payload.time_end.length > 0 ? payload.time_end : null;

  const rows = await sql<EventItem>`
    INSERT INTO events (
      type, is_active, event_date, time_start, time_end,
      venue_name, address, maps_url, latitude, longitude, dress_code, order_index
    )
    VALUES (
      ${payload.type},
      ${payload.is_active},
      ${eventDate},
      ${timeStart},
      ${timeEnd},
      ${sanitizeText(payload.venue_name ?? '')},
      ${sanitizeText(payload.address ?? '')},
      ${sanitizeText(payload.maps_url ?? '')},
      ${payload.latitude ?? null},
      ${payload.longitude ?? null},
      ${sanitizeText(payload.dress_code ?? '')},
      ${payload.order_index}
    )
    RETURNING *
  `;

  invalidateCache([CACHE_KEYS.EVENTS]);
  return jsonSuccess(rows[0]);
}
