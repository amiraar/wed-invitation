import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { FaqSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { FaqItem } from '@/lib/types';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = FaqSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  const payload = parsed.data;
  const rows = await sql<FaqItem>`
    UPDATE faqs
    SET question = ${sanitizeText(payload.question)},
        answer = ${sanitizeText(payload.answer)},
        order_index = ${payload.order_index}
    WHERE id = ${id}
    RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data not found.', 404);

  invalidateCache([CACHE_KEYS.FAQS]);
  return jsonSuccess(data);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  const rows = await sql<FaqItem>`
    DELETE FROM faqs WHERE id = ${id} RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data not found.', 404);

  invalidateCache([CACHE_KEYS.FAQS]);
  return jsonSuccess({ deleted: true });
}
