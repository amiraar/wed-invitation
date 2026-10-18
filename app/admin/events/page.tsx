'use client';

import { useEffect, useState } from 'react';
import EventForm from '@/components/admin/EventForm';
import { useToast } from '@/components/admin/ToastProvider';
import { eventTypeLabel } from '@/lib/format';
import { friendlyError } from '@/lib/fieldLabels';
import type { EventItem } from '@/lib/types';

export default function EventsPage() {
  const toast = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setEvents(data.data);
      })
      .catch(() => toast('Could not load events. Please refresh the page.', 'error'));
  }, [toast]);

  const handleUpdate = (updated: EventItem) => {
    setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleSave = async (event: EventItem) => {
    const payload = {
      ...event,
      event_date: event.event_date ?? '',
      time_start: event.time_start ?? '',
      time_end: event.time_end ?? ''
    };
    const response = await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    const label = eventTypeLabel(event.type);
    toast(data?.success ? `${label} saved.` : `${label}: ${friendlyError(data?.error)}`, data?.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      <p className="text-xs leading-relaxed" style={{ color: 'var(--adm-text-muted)' }}>
        Turn an event off to hide it everywhere on the invitation. On a personal link, guests only see the events they
        are invited to (set per guest in Guest List).
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="space-y-3">
            <EventForm event={event} onChange={handleUpdate} />
            <button onClick={() => handleSave(event)} className="admin-btn-primary w-full">
              Save {eventTypeLabel(event.type)}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
