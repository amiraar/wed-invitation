// Guest-supplied text starting with = + - @ (or tab/CR) would run as a formula in Excel/Sheets;
// a leading ' makes the spreadsheet treat it as plain text.
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

// BOM so Excel opens UTF-8 (accented names) correctly.
export function csvDocument(rows: string[][]): string {
  return '﻿' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function csvResponse(body: string, filename: string): Response {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
