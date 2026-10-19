import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, jsonValidationError } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { decodeDeep, sanitizeText } from '@/lib/sanitize';
import { GalleryItemSchema } from '@/lib/validations';
import type { GalleryItem } from '@/lib/types';

const TTL_MS = 30 * 1000;

export async function GET() {
  const cached = getCache<GalleryItem[]>(CACHE_KEYS.GALLERY);
  if (cached) return jsonSuccess(decodeDeep(cached));

  const rows = await sql<GalleryItem>`
    SELECT * FROM gallery ORDER BY order_index ASC
  `;
  setCache(CACHE_KEYS.GALLERY, rows, TTL_MS);
  return jsonSuccess(decodeDeep(rows));
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = GalleryItemSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const payload = parsed.data;
  const rows = await sql<GalleryItem>`
    INSERT INTO gallery (url, caption, order_index)
    VALUES (
      ${sanitizeText(payload.url)},
      ${sanitizeText(payload.caption ?? '')},
      ${payload.order_index ?? 0}
    )
    RETURNING *
  `;

  invalidateCache([CACHE_KEYS.GALLERY]);
  return jsonSuccess(decodeDeep(rows[0]));
}
