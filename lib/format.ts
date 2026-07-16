import type { EventItem } from './types';

const EVENT_TYPE_LABELS: Record<EventItem['type'], string> = {
  lamaran: 'Lamaran',
  akad: 'Akad Nikah',
  resepsi: 'Resepsi'
};

export function eventTypeLabel(type: EventItem['type']): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

export function formatDateID(value: string | null): string {
  if (!value) return '';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatDateShortID(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatTime(value: string | null): string {
  if (!value) return '';
  const [hours, minutes] = value.split(':');
  if (hours === undefined || minutes === undefined) return value;
  return `${hours}.${minutes}`;
}

export function formatTimeRange(start: string | null, end: string | null): string {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from && to) return `${from} – ${to}`;
  if (from) return `${from} – selesai`;
  return '';
}

export function eventTargetDate(event: Pick<EventItem, 'event_date' | 'time_start'>): Date | null {
  if (!event.event_date) return null;
  const time = event.time_start ? event.time_start.slice(0, 5) : '00:00';
  const date = new Date(`${event.event_date.slice(0, 10)}T${time}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
