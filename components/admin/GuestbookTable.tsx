'use client';

import type { GuestbookItem } from '@/lib/types';

export default function GuestbookTable({
  rows,
  onAction
}: {
  rows: GuestbookItem[];
  onAction: (id: string, action: 'approve' | 'reject') => void;
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.2em] text-gray-400">
          <tr>
            <th className="px-4 py-3">Nama</th>
            <th className="px-4 py-3">Pesan</th>
            <th className="px-4 py-3">Tanggal</th>
            <th className="px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100">
              <td className="px-4 py-3 text-gray-800">{row.name}</td>
              <td className="px-4 py-3 text-gray-600">{row.message}</td>
              <td className="px-4 py-3 text-gray-500">{row.created_at}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => onAction(row.id, 'approve')}
                    className="rounded-full border border-green-400 px-3 py-1 text-xs text-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onAction(row.id, 'reject')}
                    className="rounded-full border border-red-400 px-3 py-1 text-xs text-red-600"
                  >
                    Reject
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
