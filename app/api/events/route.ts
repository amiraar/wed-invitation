import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, jsonValidationError } from '@/lib/api';
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

  // The driver turns DATE into a JS Date (ISO timestamp, timezone-shifted), TIME into "HH:MM:SS"
  // and DECIMAL into a string; return them in the shapes EventSchema accepts so admin saves work.
  const rows = await sql<EventItem>`
    SELECT id, type, is_active,
           to_char(event_date, 'YYYY-MM-DD') AS event_date,
           to_char(time_start, 'HH24:MI') AS time_start,
           to_char(time_end, 'HH24:MI') AS time_end,
           venue_name, address, maps_url,
           latitude::float8 AS latitude, longitude::float8 AS longitude,
           dress_code, order_index, created_at, updated_at
    FROM events ORDER BY order_index ASC
  `;
  setCache(CACHE_KEYS.EVENTS, rows, TTL_MS);
  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

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
