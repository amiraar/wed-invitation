import type { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { sanitizeText } from '@/lib/sanitize';
import { TOKEN_RE, generateToken, guestKey, normalizePhone } from '@/lib/guests';

const MAX_BYTES = 1024 * 1024;
const MAX_ROWS = 2000;

// Header names (lowercase, letters/digits only) accepted for each column, English + Indonesian.
const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'nama', 'namatamu', 'guest', 'guestname', 'tamu'],
  phone: ['phone', 'telepon', 'telp', 'nohp', 'hp', 'whatsapp', 'wa', 'nowa', 'nomor', 'nomorhp'],
  max_guests: ['maxguests', 'pax', 'jumlah', 'jumlahtamu', 'kuota', 'max'],
  group: ['group', 'grup', 'kategori', 'category', 'kelompok'],
  lamaran: ['lamaran', 'engagement'],
  akad: ['akad', 'akadnikah'],
  resepsi: ['resepsi', 'reception'],
  token: ['token', 'link', 'personallink']
};
const YES = new Set(['ya', 'iya', 'y', 'yes', '1', 'true', 'x', 'v', '✓', '✔']);

type Column = keyof typeof HEADER_ALIASES;
type Skipped = { row: number; reason: string };
type GuestData = {
  id: string | null;
  token: string;
  name: string;
  guest_key: string;
  phone: string | null;
  max_guests: number;
  group_name: string;
  invite_lamaran: boolean;
  invite_akad: boolean;
  invite_resepsi: boolean;
};

async function readTable(file: File): Promise<string[][] | string> {
  const name = file.name.toLowerCase();
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (name.endsWith('.xlsx')) {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return 'This file is not a valid .xlsx file.';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return 'The spreadsheet has no sheets.';
    const table: string[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      for (let col = 1; col <= sheet.columnCount; col++) cells.push(row.getCell(col).text ?? '');
      table.push(cells);
    });
    return table;
  }
  if (name.endsWith('.csv')) {
    const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
    // Delimiter is auto-detected: Excel with Indonesian settings saves CSV with ";".
    const parsed = Papa.parse<string[]>(text, { skipEmptyLines: 'greedy' });
    return parsed.data;
  }
  return 'Please upload a .csv or .xlsx file.';
}

function mapHeader(header: string[]): Partial<Record<Column, number>> {
  const map: Partial<Record<Column, number>> = {};
  header.forEach((cell, index) => {
    const key = cell.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const [column, aliases] of Object.entries(HEADER_ALIASES) as [Column, string[]][]) {
      if (map[column] === undefined && aliases.includes(key)) map[column] = index;
    }
  });
  return map;
}

function tokenFrom(value: string): string | null {
  const last = value.trim().split('/').filter(Boolean).pop() ?? '';
  return TOKEN_RE.test(last) ? last : null;
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return jsonError('Please choose a file to import.', 400);
  if (file.size > MAX_BYTES) return jsonError('The file is too large (max 1 MB).', 400);
  const removeMissing = form?.get('remove_missing') === 'true';

  let table: string[][] | string;
  try {
    table = await readTable(file);
  } catch {
    return jsonError('The file could not be read. Please check it is a valid .csv or .xlsx file.', 400);
  }
  if (typeof table === 'string') return jsonError(table, 400);

  const [header, ...body] = table;
  if (!header) return jsonError('The file is empty.', 400);
  const columns = mapHeader(header);
  if (columns.name === undefined) return jsonError("The file needs a 'name' column.", 400);
  if (body.length > MAX_ROWS) return jsonError(`Too many rows (max ${MAX_ROWS}).`, 400);
  const hasEventColumns = columns.lamaran !== undefined || columns.akad !== undefined || columns.resepsi !== undefined;

  const existing = await sql<GuestData & { id: string }>`
    SELECT id, token, name, guest_key, phone, max_guests, group_name, invite_lamaran, invite_akad, invite_resepsi
    FROM guests
  `;
  const byToken = new Map(existing.map((guest) => [guest.token, guest]));
  const byKey = new Map(existing.map((guest) => [guest.guest_key, guest]));
  const nameOf = (key: string) => key.split('|')[0];
  const groupOf = (key: string) => key.split('|').slice(1).join('|');

  const skipped: Skipped[] = [];
  const data: GuestData[] = [];
  const seenKeys = new Set<string>();
  const seenIds = new Set<string>();

  body.forEach((cells, index) => {
    const rowNumber = index + 2;
    const cell = (column: Column) => (columns[column] === undefined ? '' : (cells[columns[column]!] ?? '').trim());
    const skip = (reason: string) => skipped.push({ row: rowNumber, reason });

    const name = cell('name').replace(/\s+/g, ' ');
    if (name.length < 2 || name.length > 150) return skip('Name must be 2–150 characters.');
    const group = cell('group').replace(/\s+/g, ' ');
    if (group.length > 100) return skip('Group must be at most 100 characters.');

    // Match: exported link/token first (keeps the shared link even when renamed), then name+group.
    // Without a group column, a name matches when exactly one existing guest has it.
    const tokenValue = cell('token');
    let match = tokenValue ? byToken.get(tokenFrom(tokenValue) ?? '') : undefined;
    if (!match && columns.group !== undefined) match = byKey.get(guestKey(name, group));
    if (!match && columns.group === undefined) {
      const sameName = existing.filter((guest) => nameOf(guest.guest_key) === nameOf(guestKey(name, '')));
      if (sameName.length > 1) return skip('Several guests have this name; add a group column.');
      match = sameName[0];
    }

    // Columns missing from the file keep the guest's current values (defaults for new guests).
    const groupKeyPart = columns.group !== undefined ? group : match ? groupOf(match.guest_key) : '';
    const key = guestKey(name, groupKeyPart);
    if (seenKeys.has(key)) return skip('Duplicate name in the same group within this file.');
    const owner = byKey.get(key);
    if (owner && owner.id !== match?.id) return skip('Another guest already has this name in the same group.');
    if (match && seenIds.has(match.id)) return skip('This guest appears twice in the file.');

    let phone = match?.phone ?? null;
    if (columns.phone !== undefined) {
      const normalized = normalizePhone(cell('phone'));
      if (normalized === null) return skip(`Invalid phone number "${cell('phone')}".`);
      phone = normalized || null;
    }

    let maxGuests = match?.max_guests ?? 1;
    if (cell('max_guests') !== '') {
      maxGuests = Number(cell('max_guests'));
      if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) return skip('Max guests must be a whole number from 1 to 20.');
    }

    const yes = (column: Column) => YES.has(cell(column).toLowerCase());
    const invite = hasEventColumns
      ? { lamaran: yes('lamaran'), akad: yes('akad'), resepsi: yes('resepsi') }
      : match
        ? { lamaran: match.invite_lamaran, akad: match.invite_akad, resepsi: match.invite_resepsi }
        : { lamaran: true, akad: true, resepsi: true };
    if (!invite.lamaran && !invite.akad && !invite.resepsi) return skip('Choose at least one event (lamaran, akad or resepsi).');

    seenKeys.add(key);
    if (match) seenIds.add(match.id);
    data.push({
      id: match?.id ?? null,
      token: match?.token ?? generateToken(),
      name: sanitizeText(name),
      guest_key: key,
      phone,
      max_guests: maxGuests,
      // Stored values are already sanitized, so an unchanged group is reused as-is.
      group_name: columns.group !== undefined ? sanitizeText(group) : (match?.group_name ?? ''),
      invite_lamaran: invite.lamaran,
      invite_akad: invite.akad,
      invite_resepsi: invite.resepsi
    });
  });

  // No valid rows: change nothing (also never "remove missing" — that would empty the whole list).
  if (data.length === 0) {
    return jsonSuccess({ created: 0, updated: 0, removed: 0, skipped: skipped.slice(0, 100), skippedCount: skipped.length });
  }

  // One statement: either every valid row is applied or nothing changes.
  let result: { created: number; updated: number; removed: number } | undefined;
  try {
    const rows = await sql<{ created: number; updated: number; removed: number }>`
      WITH data AS (
        SELECT * FROM json_to_recordset(${JSON.stringify(data)}::json) AS d(
          id uuid, token text, name text, guest_key text, phone text, max_guests int, group_name text,
          invite_lamaran boolean, invite_akad boolean, invite_resepsi boolean
        )
      ),
      upd AS (
        UPDATE guests g
        SET name = d.name, guest_key = d.guest_key, phone = d.phone, max_guests = d.max_guests,
            group_name = d.group_name, invite_lamaran = d.invite_lamaran, invite_akad = d.invite_akad,
            invite_resepsi = d.invite_resepsi, updated_at = NOW()
        FROM data d
        WHERE d.id IS NOT NULL AND g.id = d.id
        RETURNING g.id
      ),
      ins AS (
        INSERT INTO guests (token, name, guest_key, phone, max_guests, group_name, invite_lamaran, invite_akad, invite_resepsi)
        SELECT token, name, guest_key, phone, max_guests, group_name, invite_lamaran, invite_akad, invite_resepsi
        FROM data WHERE id IS NULL
        RETURNING id
      ),
      del AS (
        DELETE FROM guests
        WHERE ${removeMissing} AND id NOT IN (SELECT id FROM data WHERE id IS NOT NULL)
        RETURNING id
      )
      SELECT (SELECT count(*) FROM ins)::int AS created,
             (SELECT count(*) FROM upd)::int AS updated,
             (SELECT count(*) FROM del)::int AS removed
    `;
    result = rows[0];
  } catch {
    return jsonError('Import failed; nothing was changed. Please check the file and try again.', 400);
  }

  return jsonSuccess({ ...result, skipped: skipped.slice(0, 100), skippedCount: skipped.length });
}
