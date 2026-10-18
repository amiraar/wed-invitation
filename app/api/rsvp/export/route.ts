import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { jsonError } from '@/lib/api';
import { csvDocument, csvResponse } from '@/lib/csv';
import { decodeText } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const rows = await sql<{
    name: string;
    phone: string | null;
    guest_count: number;
    attending_lamaran: boolean;
    attending_akad: boolean;
    attending_resepsi: boolean;
    message: string;
    created_at: Date;
  }>`
    SELECT name, phone, guest_count, attending_lamaran, attending_akad, attending_resepsi, message, created_at
    FROM rsvp
    ORDER BY created_at DESC
  `;

  const header = [
    'name',
    'phone',
    'guest_count',
    'attending_lamaran',
    'attending_akad',
    'attending_resepsi',
    'message',
    'created_at'
  ];

  const lines = rows.map((row) => [
    decodeText(row.name),
    row.phone ?? '',
    row.guest_count.toString(),
    row.attending_lamaran ? 'true' : 'false',
    row.attending_akad ? 'true' : 'false',
    row.attending_resepsi ? 'true' : 'false',
    decodeText(row.message ?? '').replace(/\n/g, ' '),
    // The Neon driver returns TIMESTAMPTZ as a Date, not a string.
    new Date(row.created_at).toISOString()
  ]);

  return csvResponse(csvDocument([header, ...lines]), 'rsvp.csv');
}
