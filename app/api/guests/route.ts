import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, jsonValidationError } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { GuestSchema } from '@/lib/validations';
import { decodeText, sanitizeText } from '@/lib/sanitize';
import { DEFAULT_INVITE_MESSAGE, generateToken, guestKey, listGuests, normalizePhone } from '@/lib/guests';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const [guests, config] = await Promise.all([
    listGuests(),
    sql<{ groom_name: string; bride_name: string; invite_message: string | null }>`
      SELECT groom_name, bride_name, invite_message FROM wedding_config WHERE id = 'main' LIMIT 1
    `
  ]);
  const wedding = config[0];
  const couple = [wedding?.groom_name, wedding?.bride_name].filter(Boolean).map((n) => decodeText(n as string)).join(' & ');

  return jsonSuccess({
    guests,
    couple,
    inviteMessage: decodeText(wedding?.invite_message ?? '') || DEFAULT_INVITE_MESSAGE
  });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = GuestSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  const payload = parsed.data;
  if (!payload.invite_lamaran && !payload.invite_akad && !payload.invite_resepsi) {
    return jsonError('Choose at least one event for this guest.', 400);
  }
  const phone = normalizePhone(payload.phone ?? '');
  if (phone === null) return jsonError('Invalid phone number.', 400);
  const group = payload.group_name ?? '';

  const rows = await sql<{ id: string }>`
    INSERT INTO guests (token, name, guest_key, phone, max_guests, group_name, invite_lamaran, invite_akad, invite_resepsi)
    VALUES (
      ${generateToken()}, ${sanitizeText(payload.name)}, ${guestKey(payload.name, group)}, ${phone || null},
      ${payload.max_guests}, ${sanitizeText(group)}, ${payload.invite_lamaran}, ${payload.invite_akad}, ${payload.invite_resepsi}
    )
    ON CONFLICT (guest_key) DO NOTHING
    RETURNING id
  `;
  if (!rows[0]) return jsonError('A guest with this name already exists in this group.', 409);
  return jsonSuccess({ id: rows[0].id }, 201);
}
