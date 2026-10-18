import { randomBytes } from 'node:crypto';
import { cache } from 'react';
import { sql } from './db';
import { decodeText } from './sanitize';
import type { GuestItem, GuestView } from './types';

// 9 random bytes → exactly 12 base64url characters (72 bits): short enough for a
// WhatsApp message, impossible to guess.
export const TOKEN_RE = /^[A-Za-z0-9_-]{12}$/;

export function generateToken(): string {
  return randomBytes(9).toString('base64url');
}

export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'guest';
}

// Identifies a guest for imports: the same name may exist once per group.
export function guestKey(name: string, group: string): string {
  const clean = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  return `${clean(name)}|${clean(group)}`;
}

const phoneRegex = /^(\+62|62|0)8\d{7,12}$/;

// Returns '' for empty input, null when the number is invalid.
// Excel drops the leading 0 of "0812…", so "812…" gets it back.
export function normalizePhone(value: string): string | null {
  const compact = value.replace(/[\s\-.()]/g, '');
  if (!compact) return '';
  const phone = /^8\d{8,12}$/.test(compact) ? `0${compact}` : compact;
  return phoneRegex.test(phone) ? phone : null;
}

export function guestPath(guest: { name: string; token: string }): string {
  return `/to/${slugify(guest.name)}/${guest.token}`;
}

export function appBaseUrl(requestUrl: string): string {
  return (process.env.NEXT_PUBLIC_APP_URL || new URL(requestUrl).origin).replace(/\/+$/, '');
}

type GuestListRow = {
  id: string;
  token: string;
  name: string;
  phone: string | null;
  max_guests: number;
  group_name: string;
  invite_lamaran: boolean;
  invite_akad: boolean;
  invite_resepsi: boolean;
  rsvp_id: string | null;
  rsvp_guest_count: number | null;
  rsvp_lamaran: boolean | null;
  rsvp_akad: boolean | null;
  rsvp_resepsi: boolean | null;
  rsvp_message: string | null;
  rsvp_updated_at: Date | string | null;
};

// Admin list: every guest with their RSVP summary, grouped and sorted by name.
export async function listGuests(): Promise<GuestItem[]> {
  const rows = await sql<GuestListRow>`
    SELECT g.id, g.token, g.name, g.phone, g.max_guests, g.group_name,
           g.invite_lamaran, g.invite_akad, g.invite_resepsi,
           r.id AS rsvp_id, r.guest_count AS rsvp_guest_count,
           r.attending_lamaran AS rsvp_lamaran, r.attending_akad AS rsvp_akad, r.attending_resepsi AS rsvp_resepsi,
           r.message AS rsvp_message, COALESCE(r.updated_at, r.created_at) AS rsvp_updated_at
    FROM guests g
    LEFT JOIN rsvp r ON r.guest_id = g.id
    ORDER BY lower(g.group_name), lower(g.name)
  `;
  return rows.map((row) => {
    const name = decodeText(row.name);
    const attending = Boolean(row.rsvp_lamaran || row.rsvp_akad || row.rsvp_resepsi);
    return {
      id: row.id,
      token: row.token,
      name,
      phone: row.phone,
      max_guests: row.max_guests,
      group_name: decodeText(row.group_name),
      invite_lamaran: row.invite_lamaran,
      invite_akad: row.invite_akad,
      invite_resepsi: row.invite_resepsi,
      path: guestPath({ name, token: row.token }),
      rsvp_status: row.rsvp_id ? (attending ? 'attending' : 'declined') : 'pending',
      rsvp_guest_count: row.rsvp_guest_count,
      rsvp_lamaran: Boolean(row.rsvp_lamaran),
      rsvp_akad: Boolean(row.rsvp_akad),
      rsvp_resepsi: Boolean(row.rsvp_resepsi),
      rsvp_message: decodeText(row.rsvp_message ?? ''),
      rsvp_updated_at: row.rsvp_updated_at ? new Date(row.rsvp_updated_at).toISOString() : null
    };
  });
}

export const DEFAULT_INVITE_MESSAGE =
  'Dear {name},\n\nWith joy, {couple} invite you to celebrate our wedding. Your personal invitation:\n{link}\n\nWe would be honored by your presence and blessings.';

type GuestRow = {
  id: string;
  token: string;
  name: string;
  max_guests: number;
  invite_lamaran: boolean;
  invite_akad: boolean;
  invite_resepsi: boolean;
  rsvp_guest_count: number | null;
  attending_lamaran: boolean | null;
  attending_akad: boolean | null;
  attending_resepsi: boolean | null;
  rsvp_message: string | null;
};

// Everything the public page needs about the guest behind a token — no id or phone
// leaves the server. Returns null for an unknown token; DB errors propagate.
export const getGuestByToken = cache(async (token: string): Promise<(GuestView & { id: string }) | null> => {
  if (!TOKEN_RE.test(token)) return null;
  const rows = await sql<GuestRow>`
    SELECT g.id, g.token, g.name, g.max_guests, g.invite_lamaran, g.invite_akad, g.invite_resepsi,
           r.guest_count AS rsvp_guest_count, r.attending_lamaran, r.attending_akad, r.attending_resepsi,
           r.message AS rsvp_message
    FROM guests g
    LEFT JOIN rsvp r ON r.guest_id = g.id
    WHERE g.token = ${token}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const hasRsvp = row.rsvp_guest_count !== null;
  return {
    id: row.id,
    token: row.token,
    name: decodeText(row.name),
    maxGuests: row.max_guests,
    invited: { lamaran: row.invite_lamaran, akad: row.invite_akad, resepsi: row.invite_resepsi },
    rsvp: hasRsvp
      ? {
          attending: Boolean(row.attending_lamaran || row.attending_akad || row.attending_resepsi),
          guestCount: row.rsvp_guest_count ?? 1,
          lamaran: Boolean(row.attending_lamaran),
          akad: Boolean(row.attending_akad),
          resepsi: Boolean(row.attending_resepsi),
          message: decodeText(row.rsvp_message ?? '')
        }
      : null
  };
});
