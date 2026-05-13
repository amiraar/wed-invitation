'use client';

import type { RSVPItem } from '@/lib/types';

export default function RSVPTable({ rows }: { rows: RSVPItem[] }) {
  return (
    <div className="overflow-auto rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
          <tr>
            <th className="px-4 py-3">Nama</th>
            <th className="px-4 py-3">HP</th>
            <th className="px-4 py-3">Tamu</th>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Tanggal</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="px-4 py-3 text-gray-800">{row.name}</td>
              <td className="px-4 py-3 text-gray-600">{row.phone ?? '-'}</td>
              <td className="px-4 py-3 text-gray-600">{row.guest_count}</td>
              <td className="px-4 py-3 text-gray-600">
                {[
                  row.attending_lamaran && 'Lamaran',
                  row.attending_akad && 'Akad',
                  row.attending_resepsi && 'Resepsi'
                ]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </td>
              <td className="px-4 py-3 text-gray-500">{row.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
