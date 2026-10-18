'use client';

import Toggle from '@/components/ui/Toggle';
import { eventTypeLabel } from '@/lib/format';
import type { EventItem } from '@/lib/types';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {children}
    </label>
  );
}

export default function EventForm({
  event,
  onChange
}: {
  event: EventItem;
  onChange: (updated: EventItem) => void;
}) {
  const handleChange = (key: keyof EventItem, value: string | boolean | number | null) => {
    onChange({ ...event, [key]: value } as EventItem);
  };
  const label = eventTypeLabel(event.type);

  return (
    <div className="admin-card grid gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>
          {label}
        </h3>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
          Show on invitation
          <Toggle label={`Show ${label} on invitation`} checked={event.is_active} onChange={(value) => handleChange('is_active', value)} />
        </div>
      </div>
      <Field label="Date">
        <input type="date" value={event.event_date ?? ''} onChange={(e) => handleChange('event_date', e.target.value)} className="admin-input w-full" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start time">
          <input type="time" value={event.time_start ?? ''} onChange={(e) => handleChange('time_start', e.target.value)} className="admin-input w-full" />
        </Field>
        <Field label="End time">
          <input type="time" value={event.time_end ?? ''} onChange={(e) => handleChange('time_end', e.target.value)} className="admin-input w-full" />
        </Field>
      </div>
      <Field label="Venue name">
        <input value={event.venue_name} onChange={(e) => handleChange('venue_name', e.target.value)} className="admin-input w-full" />
      </Field>
      <Field label="Address">
        <input value={event.address} onChange={(e) => handleChange('address', e.target.value)} className="admin-input w-full" />
      </Field>
      <Field label="Maps link">
        <input value={event.maps_url} onChange={(e) => handleChange('maps_url', e.target.value)} placeholder="https://maps.google.com/..." className="admin-input w-full" />
      </Field>
      <Field label="Dress code">
        <input value={event.dress_code} onChange={(e) => handleChange('dress_code', e.target.value)} className="admin-input w-full" />
      </Field>
    </div>
  );
}
