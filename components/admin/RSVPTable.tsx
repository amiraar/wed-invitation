'use client';

import type { RSVPItem } from '@/lib/types';

// onDelete is optional: the dashboard shows a read-only preview without the Action column.
export default function RSVPTable({ rows, onDelete }: { rows: RSVPItem[]; onDelete?: (id: string) => void }) {
  return (
    <div className="admin-card overflow-auto">
      <table className="min-w-full text-sm">
        <thead
          className="text-left text-[10px] uppercase tracking-[0.2em]"
          style={{ background: 'var(--adm-bg-topbar)', color: 'var(--adm-text-faint)' }}
        >
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Guests</th>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">Date</th>
            {onDelete && <th className="px-4 py-3">Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ borderTop: '1px solid var(--adm-border)' }}>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text)' }}>{row.name}</td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>{row.phone ?? '-'}</td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>{row.guest_count}</td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text-muted)' }}>
                {[
                  row.attending_lamaran && 'Engagement',
                  row.attending_akad && 'Akad',
                  row.attending_resepsi && 'Reception'
                ]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </td>
              <td className="px-4 py-3" style={{ color: 'var(--adm-text-faint)' }}>{row.created_at}</td>
              {onDelete && (
                <td className="px-4 py-3">
                  <button onClick={() => onDelete(row.id)} className="admin-btn-danger">
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
