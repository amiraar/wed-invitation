'use client';

import type { EventItem } from '@/lib/types';

export default function EventForm({
  event,
  onSave
}: {
  event: EventItem;
  onSave: (updated: EventItem) => void;
}) {
  const handleChange = (key: keyof EventItem, value: string | boolean | number | null) => {
    onSave({ ...event, [key]: value } as EventItem);
  };

  return (
    <div className="admin-card grid gap-3 p-4">
      <h3 className="font-display text-lg capitalize italic" style={{ color: '#C8DEC8' }}>
        {event.type}
      </h3>
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text-muted)' }}>
        <input
          type="checkbox"
          checked={event.is_active}
          onChange={(eventChange) => handleChange('is_active', eventChange.target.checked)}
          style={{ accentColor: 'var(--adm-accent)' }}
        />
        Active
      </label>
      <input
        value={event.event_date ?? ''}
        onChange={(eventChange) => handleChange('event_date', eventChange.target.value)}
        placeholder="Date (YYYY-MM-DD)"
        className="admin-input"
      />
      <input
        value={event.time_start ?? ''}
        onChange={(eventChange) => handleChange('time_start', eventChange.target.value)}
        placeholder="Start time (HH:MM)"
        className="admin-input"
      />
      <input
        value={event.time_end ?? ''}
        onChange={(eventChange) => handleChange('time_end', eventChange.target.value)}
        placeholder="End time (HH:MM)"
        className="admin-input"
      />
      <input
        value={event.venue_name}
        onChange={(eventChange) => handleChange('venue_name', eventChange.target.value)}
        placeholder="Venue name"
        className="admin-input"
      />
      <input
        value={event.address}
        onChange={(eventChange) => handleChange('address', eventChange.target.value)}
        placeholder="Address"
        className="admin-input"
      />
      <input
        value={event.maps_url}
        onChange={(eventChange) => handleChange('maps_url', eventChange.target.value)}
        placeholder="Maps URL"
        className="admin-input"
      />
      <input
        value={event.dress_code}
        onChange={(eventChange) => handleChange('dress_code', eventChange.target.value)}
        placeholder="Dress code"
        className="admin-input"
      />
    </div>
  );
}
