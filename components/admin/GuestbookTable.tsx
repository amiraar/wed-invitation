'use client';

import { formatDateShortID } from '@/lib/format';
import type { GuestbookItem } from '@/lib/types';

// Buttons follow the wish's state: pending → Approve, approved → Hide (back to pending).
export default function GuestbookTable({
  rows,
  onAction,
  onDelete
}: {
  rows: GuestbookItem[];
  onAction: (id: string, action: 'approve' | 'reject') => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="admin-card overflow-x-auto">
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
              <td className="px-4 py-3 align-top" style={{ color: 'var(--adm-text)' }}>
                {row.name}
                {row.is_anonymous && (
                  <span className="block text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--adm-text-faint)' }}>
                    shown as Someone
                  </span>
                )}
              </td>
              <td className="min-w-[14rem] px-4 py-3 align-top" style={{ color: 'var(--adm-text-muted)' }}>{row.message}</td>
              <td className="whitespace-nowrap px-4 py-3 align-top" style={{ color: 'var(--adm-text-faint)' }}>
                {formatDateShortID(row.created_at)}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex flex-wrap gap-2">
                  {row.is_approved ? (
                    <button onClick={() => onAction(row.id, 'reject')} className="admin-btn-outline">
                      Hide
                    </button>
                  ) : (
                    <button onClick={() => onAction(row.id, 'approve')} className="admin-btn-outline">
                      Approve
                    </button>
                  )}
                  <button onClick={() => onDelete(row.id)} className="admin-btn-danger">
                    Delete
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
