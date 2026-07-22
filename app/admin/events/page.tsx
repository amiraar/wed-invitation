'use client';

import { useEffect, useState } from 'react';
import EventForm from '@/components/admin/EventForm';
import type { EventItem } from '@/lib/types';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setEvents(data.data);
      })
      .catch(() => undefined);
  }, []);

  const handleUpdate = (updated: EventItem) => {
    setEvents((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const handleSave = async (event: EventItem) => {
    setStatus('Saving...');
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
    });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Saved' : data?.error || 'Failed to save');
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {events.map((event) => (
          <div key={event.id} className="space-y-3">
            <EventForm event={event} onSave={handleUpdate} />
            <button onClick={() => handleSave(event)} className="admin-btn-primary w-full">
              Save {event.type}
            </button>
          </div>
        ))}
      </div>
      {status && <p className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>{status}</p>}
    </div>
  );
}
