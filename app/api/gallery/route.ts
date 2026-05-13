import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { sanitizeText } from '@/lib/sanitize';
import type { GalleryItem } from '@/lib/types';

const TTL_MS = 30 * 1000;

const GallerySchema = z.object({
  url: z.string().url().max(500),
  caption: z.string().max(200).optional().or(z.literal('')),
  order_index: z.number().int().min(0).max(100).optional()
});

export async function GET() {
  const cached = getCache<GalleryItem[]>(CACHE_KEYS.GALLERY);
  if (cached) return jsonSuccess(cached);

  const rows = await sql<GalleryItem>`
    SELECT * FROM gallery ORDER BY order_index ASC
  `;
  setCache(CACHE_KEYS.GALLERY, rows, TTL_MS);
  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = GallerySchema.safeParse(body);
  if (!parsed.success) return jsonError('Data tidak valid.', 400);

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
  return jsonSuccess(rows[0]);
}
