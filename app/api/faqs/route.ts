import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { FaqSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { FaqItem } from '@/lib/types';

const TTL_MS = 30 * 1000;

export async function GET() {
  const cached = getCache<FaqItem[]>(CACHE_KEYS.FAQS);
  if (cached) return jsonSuccess(cached);

  const rows = await sql<FaqItem>`
    SELECT * FROM faqs ORDER BY order_index ASC
  `;
  setCache(CACHE_KEYS.FAQS, rows, TTL_MS);
  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = FaqSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  const payload = parsed.data;
  const rows = await sql<FaqItem>`
    INSERT INTO faqs (question, answer, order_index)
    VALUES (
      ${sanitizeText(payload.question)},
      ${sanitizeText(payload.answer)},
      ${payload.order_index}
    )
    RETURNING *
  `;

  invalidateCache([CACHE_KEYS.FAQS]);
  return jsonSuccess(rows[0]);
}
