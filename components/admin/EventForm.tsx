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
    <div className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="text-lg font-semibold capitalize text-gray-800">{event.type}</h3>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={event.is_active}
          onChange={(eventChange) => handleChange('is_active', eventChange.target.checked)}
        />
        Aktif
      </label>
      <input
        value={event.event_date ?? ''}
        onChange={(eventChange) => handleChange('event_date', eventChange.target.value)}
        placeholder="Tanggal (YYYY-MM-DD)"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={event.time_start ?? ''}
        onChange={(eventChange) => handleChange('time_start', eventChange.target.value)}
        placeholder="Jam mulai (HH:MM)"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={event.time_end ?? ''}
        onChange={(eventChange) => handleChange('time_end', eventChange.target.value)}
        placeholder="Jam selesai (HH:MM)"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={event.venue_name}
        onChange={(eventChange) => handleChange('venue_name', eventChange.target.value)}
        placeholder="Nama venue"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={event.address}
        onChange={(eventChange) => handleChange('address', eventChange.target.value)}
        placeholder="Alamat"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={event.maps_url}
        onChange={(eventChange) => handleChange('maps_url', eventChange.target.value)}
        placeholder="Maps URL"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
      <input
        value={event.dress_code}
        onChange={(eventChange) => handleChange('dress_code', eventChange.target.value)}
        placeholder="Dress code"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
      />
    </div>
  );
}
