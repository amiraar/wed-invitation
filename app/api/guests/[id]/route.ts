import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { isUuid, jsonError, jsonSuccess, jsonValidationError } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { GuestSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import { guestKey, normalizePhone } from '@/lib/guests';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Data not found.', 404);
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
  const key = guestKey(payload.name, group);

  const taken = await sql<{ id: string }>`SELECT id FROM guests WHERE guest_key = ${key} AND id <> ${id} LIMIT 1`;
  if (taken[0]) return jsonError('A guest with this name already exists in this group.', 409);

  // The token stays the same, so a link that was already shared keeps working.
  const rows = await sql<{ id: string }>`
    UPDATE guests
    SET name = ${sanitizeText(payload.name)}, guest_key = ${key}, phone = ${phone || null},
        max_guests = ${payload.max_guests}, group_name = ${sanitizeText(group)},
        invite_lamaran = ${payload.invite_lamaran}, invite_akad = ${payload.invite_akad},
        invite_resepsi = ${payload.invite_resepsi}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `;
  if (!rows[0]) return jsonError('Data not found.', 404);
  return jsonSuccess({ id });
}

// Deleting a guest also deletes their RSVP (cascade); their wishes stay without a link.
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const { id } = await context.params;
  if (!isUuid(id)) return jsonError('Data not found.', 404);
  const rows = await sql<{ id: string }>`DELETE FROM guests WHERE id = ${id} RETURNING id`;
  if (!rows[0]) return jsonError('Data not found.', 404);
  return jsonSuccess({ deleted: true });
}
