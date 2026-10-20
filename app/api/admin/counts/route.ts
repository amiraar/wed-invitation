import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';

// Small numbers for the admin sidebar badges (no full lists on every page).
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const rows = await sql<{ pending_wishes: number; guests_no_reply: number }>`
    SELECT
      (SELECT count(*) FROM guestbook WHERE is_approved = FALSE)::int AS pending_wishes,
      (SELECT count(*) FROM guests g WHERE NOT EXISTS (SELECT 1 FROM rsvp r WHERE r.guest_id = g.id))::int AS guests_no_reply
  `;
  return jsonSuccess({
    pendingWishes: rows[0]?.pending_wishes ?? 0,
    guestsNoReply: rows[0]?.guests_no_reply ?? 0
  });
}
