import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import type { GuestbookItem } from '@/lib/types';

const ActionSchema = z.object({
  action: z.enum(['approve', 'reject'])
});

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) return jsonError('Data tidak valid.', 400);

  const isApproved = parsed.data.action === 'approve';
  const rows = await sql<GuestbookItem>`
    UPDATE guestbook
    SET is_approved = ${isApproved}
    WHERE id = ${context.params.id}
    RETURNING id, name, message, is_approved, created_at
  `;

  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  invalidateCache([CACHE_KEYS.GUESTBOOK_PUBLIC]);
  return jsonSuccess(data);
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const rows = await sql<GuestbookItem>`
    DELETE FROM guestbook
    WHERE id = ${context.params.id}
    RETURNING id
  `;

  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  invalidateCache([CACHE_KEYS.GUESTBOOK_PUBLIC]);
  return jsonSuccess({ deleted: true });
}
