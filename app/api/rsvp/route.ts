import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, getClientIp } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';
import { RSVPSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { RSVPItem } from '@/lib/types';

const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 3 });

export async function GET(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const rows = await sql<RSVPItem>`
    SELECT id, name, phone, guest_count, attending_lamaran, attending_akad, attending_resepsi, message, created_at
    FROM rsvp
    ORDER BY created_at DESC
  `;

  return jsonSuccess(rows);
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = limiter(ip);
  if (!limit.success) {
    return jsonError('Batas pengiriman RSVP tercapai. Coba lagi nanti.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = RSVPSchema.safeParse(body);
  if (!parsed.success) return jsonError('Data tidak valid.', 400);

  const payload = parsed.data;
  await sql`
    INSERT INTO rsvp (
      name, phone, guest_count, attending_lamaran, attending_akad, attending_resepsi, message, ip_address
    )
    VALUES (
      ${sanitizeText(payload.name)},
      ${payload.phone ? sanitizeText(payload.phone) : null},
      ${payload.guest_count},
      ${payload.attending_lamaran},
      ${payload.attending_akad},
      ${payload.attending_resepsi},
      ${sanitizeText(payload.message ?? '')},
      ${ip}
    )
  `;

  return jsonSuccess({ submitted: true });
}
