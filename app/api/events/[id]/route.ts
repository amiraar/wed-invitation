import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { EventSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { EventItem } from '@/lib/types';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return jsonError('Data tidak valid.', 400);

  const payload = parsed.data;
  const eventDate = payload.event_date && payload.event_date.length > 0 ? payload.event_date : null;
  const timeStart = payload.time_start && payload.time_start.length > 0 ? payload.time_start : null;
  const timeEnd = payload.time_end && payload.time_end.length > 0 ? payload.time_end : null;

  const rows = await sql<EventItem>`
    UPDATE events
    SET type = ${payload.type},
        is_active = ${payload.is_active},
        event_date = ${eventDate},
        time_start = ${timeStart},
        time_end = ${timeEnd},
        venue_name = ${sanitizeText(payload.venue_name ?? '')},
        address = ${sanitizeText(payload.address ?? '')},
        maps_url = ${sanitizeText(payload.maps_url ?? '')},
        latitude = ${payload.latitude ?? null},
        longitude = ${payload.longitude ?? null},
        dress_code = ${sanitizeText(payload.dress_code ?? '')},
        order_index = ${payload.order_index},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  invalidateCache([CACHE_KEYS.EVENTS]);
  return jsonSuccess(data);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  const rows = await sql<EventItem>`
    DELETE FROM events WHERE id = ${id} RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  invalidateCache([CACHE_KEYS.EVENTS]);
  return jsonSuccess({ deleted: true });
}
