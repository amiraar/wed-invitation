import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { jsonError } from '@/lib/api';

// Guest-supplied text starting with = + - @ (or tab/CR) would run as a formula in Excel/Sheets;
// a leading ' makes the spreadsheet treat it as plain text.
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

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

  const lines = [header.join(',')];
  rows.forEach((row) => {
    const values = [
      row.name,
      row.phone ?? '',
      row.guest_count.toString(),
      row.attending_lamaran ? 'true' : 'false',
      row.attending_akad ? 'true' : 'false',
      row.attending_resepsi ? 'true' : 'false',
      (row.message ?? '').replace(/\n/g, ' '),
      // The Neon driver returns TIMESTAMPTZ as a Date, not a string.
      new Date(row.created_at).toISOString()
    ].map(csvCell);
    lines.push(values.join(','));
  });

  const csv = lines.join('\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="rsvp.csv"'
    }
  });
}
