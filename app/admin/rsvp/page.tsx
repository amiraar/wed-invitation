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
        <h2 className="text-lg font-semibold">Daftar RSVP</h2>
        <a
          href="/api/rsvp/export"
          className="rounded-full border border-amber-400 bg-amber-400 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
        >
          Export CSV
        </a>
      </div>
      <RSVPTable rows={rows} />
    </div>
  );
}
