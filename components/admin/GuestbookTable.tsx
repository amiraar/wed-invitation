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
    <div className="admin-card overflow-auto">
      <table className="min-w-full text-sm">
        <thead
          className="text-left text-[10px] uppercase tracking-[0.2em]"
          style={{ background: 'var(--adm-bg-topbar)', color: 'var(--adm-text-faint)' }}
        >
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Message</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderTop: '1px solid var(--adm-border)' }}>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text)' }}>{row.name}</td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>{row.message}</td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text-faint)' }}>{row.created_at}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => onAction(row.id, 'approve')} className="admin-btn-outline">
                    Approve
                  </button>
                  <button onClick={() => onAction(row.id, 'reject')} className="admin-btn-danger">
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
