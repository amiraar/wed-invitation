import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { SettingsSchema } from '@/lib/validations';
import type { AppSettings } from '@/lib/types';

const TTL_MS = 60 * 1000;

export async function GET() {
  const cached = getCache<AppSettings>(CACHE_KEYS.SETTINGS);
  if (cached) return jsonSuccess(cached);

  const rows = await sql<AppSettings>`
    SELECT * FROM app_settings WHERE id = 'main' LIMIT 1
  `;

  const data = rows[0];
  if (!data) return jsonError('Data not found.', 404);

  setCache(CACHE_KEYS.SETTINGS, data, TTL_MS);
  return jsonSuccess(data);
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  const payload = parsed.data;

  const rows = await sql<AppSettings>`
    UPDATE app_settings
    SET theme = ${payload.theme},
        show_gallery = ${payload.show_gallery},
        show_envelope = ${payload.show_envelope},
        gallery_layout = COALESCE(${payload.gallery_layout ?? null}, gallery_layout),
        gallery_position = COALESCE(${payload.gallery_position ?? null}, gallery_position),
        updated_at = NOW()
    WHERE id = 'main'
    RETURNING *
  `;

  invalidateCache([CACHE_KEYS.SETTINGS]);
  return jsonSuccess(rows[0]);
}
