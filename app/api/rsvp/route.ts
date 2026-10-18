import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, getClientIp } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { GuestRSVPSchema } from '@/lib/validations';
import { decodeText, sanitizeText } from '@/lib/sanitize';
import { getGuestByToken } from '@/lib/guests';
import type { RSVPItem } from '@/lib/types';

// Guests may update their RSVP, so allow a few more submissions than one.
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5 });

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const rows = await sql<RSVPItem>`
    SELECT r.id, r.name, r.phone, r.guest_count, r.attending_lamaran, r.attending_akad, r.attending_resepsi,
           r.message, r.created_at, r.guest_id, g.group_name
    FROM rsvp r
    LEFT JOIN guests g ON g.id = r.guest_id
    ORDER BY COALESCE(r.updated_at, r.created_at) DESC
  `;

  return jsonSuccess(
    rows.map((row) => ({
      ...row,
      name: decodeText(row.name),
      message: decodeText(row.message ?? ''),
      group_name: row.group_name ? decodeText(row.group_name) : null
    }))
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = limiter(`rsvp:${ip}`);
  if (!limit.success) {
    return jsonError('RSVP submission limit reached. Please try again later.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = GuestRSVPSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid data.', 400);

  const payload = parsed.data;
  const guest = await getGuestByToken(payload.token);
  if (!guest) return jsonError('Invitation not found.', 404);

  // Only events this guest is invited to can be attended; name and phone come from the guest list.
  const lamaran = payload.attending && payload.attending_lamaran && guest.invited.lamaran;
  const akad = payload.attending && payload.attending_akad && guest.invited.akad;
  const resepsi = payload.attending && payload.attending_resepsi && guest.invited.resepsi;
  if (payload.attending && !lamaran && !akad && !resepsi) {
    return jsonError('Please choose at least one event you will attend.', 400);
  }
  if (payload.attending && payload.guest_count > guest.maxGuests) {
    return jsonError(`This invitation is for up to ${guest.maxGuests} ${guest.maxGuests === 1 ? 'person' : 'people'}.`, 400);
  }
  const guestCount = payload.attending ? payload.guest_count : 0;

  await sql`
    INSERT INTO rsvp (
      guest_id, name, phone, guest_count, attending_lamaran, attending_akad, attending_resepsi, message
    )
    SELECT g.id, g.name, g.phone, ${guestCount}, ${lamaran}, ${akad}, ${resepsi}, ${sanitizeText(payload.message ?? '')}
    FROM guests g WHERE g.id = ${guest.id}
    ON CONFLICT (guest_id) DO UPDATE SET
      name = EXCLUDED.name,
      phone = EXCLUDED.phone,
      guest_count = EXCLUDED.guest_count,
      attending_lamaran = EXCLUDED.attending_lamaran,
      attending_akad = EXCLUDED.attending_akad,
      attending_resepsi = EXCLUDED.attending_resepsi,
      message = EXCLUDED.message,
      updated_at = NOW()
  `;

  return jsonSuccess({ submitted: true, attending: payload.attending });
}
