'use client';

import type { RSVPItem } from '@/lib/types';

export default function RSVPTable({ rows }: { rows: RSVPItem[] }) {
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
