import type { NextRequest } from 'next/server';
import { del } from '@vercel/blob';
import { sql } from '@/lib/db';
import { isUuid, jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { decodeDeep, sanitizeText } from '@/lib/sanitize';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { GalleryPatchSchema } from '@/lib/validations';
import type { GalleryItem } from '@/lib/types';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Data not found.', 404);
  const body = await request.json().catch(() => null);
  const parsed = GalleryPatchSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  // Only the fields that were sent change (order after a drag, or caption/size/focus).
  const { order_index, caption, size, focus } = parsed.data;
  const rows = await sql<GalleryItem>`
    UPDATE gallery
    SET order_index = COALESCE(${order_index ?? null}::int, order_index),
        caption = COALESCE(${caption === undefined ? null : sanitizeText(caption)}, caption),
        size = COALESCE(${size ?? null}, size),
        focus = COALESCE(${focus ?? null}, focus)
    WHERE id = ${id}
    RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data not found.', 404);

  invalidateCache([CACHE_KEYS.GALLERY]);
  return jsonSuccess(decodeDeep(data));
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Data not found.', 404);
  const rows = await sql<GalleryItem>`
    DELETE FROM gallery WHERE id = ${id} RETURNING *
  `;

  const data = rows[0];
  if (!data) return jsonError('Data not found.', 404);

  // Uploaded photos live in our Vercel Blob store; remove the file too so it doesn't pile up.
  // Links to other sites are left alone, and a failed cleanup never fails the delete.
  const url = decodeDeep(data.url);
  if (process.env.BLOB_READ_WRITE_TOKEN && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
    await del(url).catch(() => undefined);
  }

  invalidateCache([CACHE_KEYS.GALLERY]);
  return jsonSuccess({ deleted: true });
}
