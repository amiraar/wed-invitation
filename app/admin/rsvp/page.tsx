'use client';

import { useEffect, useState } from 'react';
import RSVPTable from '@/components/admin/RSVPTable';
import type { RSVPItem } from '@/lib/types';

export default function RSVPPage() {
  const [rows, setRows] = useState<RSVPItem[]>([]);

  useEffect(() => {
    fetch('/api/rsvp')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setRows(data.data);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>RSVP List</h2>
        <a href="/api/rsvp/export" className="admin-btn-primary">
          Export CSV
        </a>
      </div>
      <RSVPTable rows={rows} />
    </div>
  );
}
