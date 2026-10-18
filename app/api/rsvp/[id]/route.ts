import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { isUuid, jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';

// Lets the admin remove a single guest's RSVP, e.g. when the guest asks for their data to be deleted.
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Data not found.', 404);
  const rows = await sql<{ id: string }>`
    DELETE FROM rsvp WHERE id = ${id} RETURNING id
  `;

  if (!rows[0]) return jsonError('Data not found.', 404);
  return jsonSuccess({ deleted: true });
}
