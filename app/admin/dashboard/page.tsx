'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import RSVPTable from '@/components/admin/RSVPTable';
import type { GuestbookItem, RSVPItem } from '@/lib/types';

export default function DashboardPage() {
  const [rsvp, setRsvp] = useState<RSVPItem[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookItem[]>([]);

  useEffect(() => {
    fetch('/api/rsvp')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setRsvp(data.data);
      })
      .catch(() => undefined);

    fetch('/api/guestbook')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setGuestbook(data.data);
      })
      .catch(() => undefined);
  }, []);

  const totalRsvp = rsvp.length;
  const hadirAkad = rsvp.filter((item) => item.attending_akad).length;
  const hadirResepsi = rsvp.filter((item) => item.attending_resepsi).length;
  const pendingGuestbook = guestbook.filter((item) => !item.is_approved).length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total RSVP" value={totalRsvp} />
        <StatCard label="Hadir Akad" value={hadirAkad} />
        <StatCard label="Hadir Resepsi" value={hadirResepsi} />
        <StatCard label="Ucapan Pending" value={pendingGuestbook} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800">RSVP Terbaru</h2>
        <div className="mt-4">
          <RSVPTable rows={rsvp.slice(0, 5)} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800">Ucapan Pending</h2>
        <div className="mt-4 space-y-3">
          {guestbook
            .filter((item) => !item.is_approved)
            .slice(0, 3)
            .map((item) => (
              <div key={item.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-sm text-gray-700">{item.message}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-400">{item.name}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
