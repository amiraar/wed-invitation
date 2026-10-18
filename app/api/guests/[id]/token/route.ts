import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { isUuid, jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { generateToken } from '@/lib/guests';

// New personal link for a guest (e.g. when the old one was forwarded). The old link stops working.
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Data not found.', 404);
  const rows = await sql<{ token: string }>`
    UPDATE guests SET token = ${generateToken()}, updated_at = NOW() WHERE id = ${id} RETURNING token
  `;
  if (!rows[0]) return jsonError('Data not found.', 404);
  return jsonSuccess({ token: rows[0].token });
}
