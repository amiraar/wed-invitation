import type { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { jsonError } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { csvDocument, csvResponse } from '@/lib/csv';
import { appBaseUrl, listGuests } from '@/lib/guests';

const IMPORT_HEADER = ['name', 'phone', 'max_guests', 'group', 'lamaran', 'akad', 'resepsi'];
const yesNo = (value: boolean) => (value ? 'yes' : 'no');

// ?format=csv|xlsx, &template=1 for an empty template with one example row.
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const format = request.nextUrl.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const template = request.nextUrl.searchParams.get('template') === '1';

  let header: string[];
  let rows: string[][];
  if (template) {
    header = IMPORT_HEADER;
    rows = [['Budi Santoso', '081234567890', '2', 'Family', 'no', 'yes', 'yes']];
  } else {
    const base = appBaseUrl(request.url);
    const guests = await listGuests();
    header = [
      ...IMPORT_HEADER,
      'link',
      'rsvp_status',
      'rsvp_guest_count',
      'rsvp_events',
      'rsvp_message',
      'rsvp_updated_at'
    ];
    rows = guests.map((guest) => [
      guest.name,
      guest.phone ?? '',
      String(guest.max_guests),
      guest.group_name,
      yesNo(guest.invite_lamaran),
      yesNo(guest.invite_akad),
      yesNo(guest.invite_resepsi),
      base + guest.path,
      guest.rsvp_status,
      guest.rsvp_guest_count === null ? '' : String(guest.rsvp_guest_count),
      [guest.rsvp_lamaran && 'lamaran', guest.rsvp_akad && 'akad', guest.rsvp_resepsi && 'resepsi'].filter(Boolean).join(', '),
      guest.rsvp_message.replace(/\r?\n/g, ' '),
      guest.rsvp_updated_at ?? ''
    ]);
  }

  const filename = template ? 'guest-template' : 'guests';
  if (format === 'csv') return csvResponse(csvDocument([header, ...rows]), `${filename}.csv`);

  // Plain string cells are never formulas in XLSX, so names like "=1+1" stay text.
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Guests');
  sheet.columns = header.map((key) => ({ header: key, key, width: key === 'link' ? 48 : Math.max(12, key.length + 2) }));
  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };
  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(buffer as ArrayBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`
    }
  });
}
