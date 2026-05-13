import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import type { GalleryItem } from '@/lib/types';

const ReorderSchema = z.object({
  order_index: z.number().int().min(0).max(100)
});

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = ReorderSchema.safeParse(body);
  if (!parsed.success) return jsonError('Data tidak valid.', 400);

  const rows = await sql<GalleryItem>`
    UPDATE gallery
    SET order_index = ${parsed.data.order_index}
    WHERE id = ${context.params.id}
    RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  invalidateCache([CACHE_KEYS.GALLERY]);
  return jsonSuccess(data);
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const rows = await sql<GalleryItem>`
    DELETE FROM gallery WHERE id = ${context.params.id} RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  invalidateCache([CACHE_KEYS.GALLERY]);
  return jsonSuccess({ deleted: true });
}
