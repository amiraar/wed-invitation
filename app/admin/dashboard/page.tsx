'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import RSVPTable from '@/components/admin/RSVPTable';
import { eventTypeLabel } from '@/lib/format';
import type { EventType, GuestbookItem, GuestItem, RSVPItem } from '@/lib/types';

const EVENT_TYPES: EventType[] = ['lamaran', 'akad', 'resepsi'];

export default function DashboardPage() {
  const [rsvp, setRsvp] = useState<RSVPItem[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookItem[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);

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

    fetch('/api/guests')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setGuests(data.data.guests);
      })
      .catch(() => undefined);
  }, []);

  // People, not submissions: an RSVP for 3 people counts as 3.
  const attendingPeople = guests.reduce(
    (sum, g) => sum + (g.rsvp_status === 'attending' ? g.rsvp_guest_count ?? 0 : 0),
    0
  );
  const noReply = guests.filter((g) => g.rsvp_status === 'pending').length;
  const pendingGuestbook = guestbook.filter((item) => !item.is_approved).length;
  const perEvent = EVENT_TYPES.map((type) => ({
    type,
    invited: guests.filter((g) => g[`invite_${type}`]).length,
    people: guests.reduce((sum, g) => sum + (g[`rsvp_${type}`] ? g.rsvp_guest_count ?? 0 : 0), 0)
  })).filter((item) => item.invited > 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Invited Guests" value={guests.length} />
        <StatCard label="Attending (people)" value={attendingPeople} />
        <StatCard label="No Reply Yet" value={noReply} />
        <StatCard label="Pending Wishes" value={pendingGuestbook} />
      </div>

      {perEvent.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {perEvent.map((item) => (
            <div key={item.type} className="admin-card p-4">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--adm-text-muted)' }}>
                {eventTypeLabel(item.type)}
              </p>
              <p className="mt-1 text-sm" style={{ color: 'var(--adm-text)' }}>
                {item.people} attending · {item.invited} invited
              </p>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>Recent RSVPs</h2>
          <Link href="/admin/guests" className="text-xs underline" style={{ color: 'var(--adm-text-muted)' }}>
            Manage guests
          </Link>
        </div>
        <div className="mt-4">
          <RSVPTable rows={rsvp.slice(0, 5)} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>Pending Wishes</h2>
        <div className="mt-4 space-y-3">
          {guestbook
            .filter((item) => !item.is_approved)
            .slice(0, 3)
            .map((item) => (
              <div key={item.id} className="admin-card p-4">
                <p className="text-sm" style={{ color: 'var(--adm-text)' }}>{item.message}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--adm-text-faint)' }}>
                  {item.name}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
