'use client';

import Toggle from '@/components/ui/Toggle';
import { eventTypeLabel } from '@/lib/format';
import type { EventItem } from '@/lib/types';

// Common Indonesian wedding dress codes, written for guests.
const DRESS_CODE_PICKS = ['Formal', 'Batik', 'Traditional attire', 'Smart casual', 'Modest attire'];

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
      <Field label="What to wear (dress code)">
        <input
          value={event.dress_code}
          onChange={(e) => handleChange('dress_code', e.target.value)}
          maxLength={100}
          placeholder="e.g. Batik or formal"
          className="admin-input w-full"
        />
      </Field>
      <div className="-mt-1 space-y-2">
        <div className="flex flex-wrap gap-2" aria-label={`Quick picks for ${label} dress code`}>
          {DRESS_CODE_PICKS.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => handleChange('dress_code', pick)}
              aria-pressed={event.dress_code === pick}
              className="min-h-[44px] rounded-full px-4 text-xs transition-colors"
              style={
                event.dress_code === pick
                  ? { border: '1px solid var(--adm-accent)', background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
                  : { border: '1px solid var(--adm-border-strong)', color: 'var(--adm-text-muted)' }
              }
            >
              {pick}
            </button>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>
          A short note shown on this event&apos;s card, so guests know what to wear. Colors are set once for all events in
          Couple &amp; Story → Dress Code.
        </p>
      </div>
    </div>
  );
}
