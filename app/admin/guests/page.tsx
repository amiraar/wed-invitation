'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/admin/ToastProvider';
import { refreshAdminCounts } from '@/components/admin/nav';
import { eventTypeLabel } from '@/lib/format';
import { friendlyError } from '@/lib/fieldLabels';
import type { EventType, GuestItem } from '@/lib/types';

const EVENT_TYPES: EventType[] = ['lamaran', 'akad', 'resepsi'];

type FormState = {
  id: string | null;
  name: string;
  phone: string;
  max_guests: number;
  group_name: string;
  invite_lamaran: boolean;
  invite_akad: boolean;
  invite_resepsi: boolean;
};

type ImportResult = {
  created: number;
  updated: number;
  removed: number;
  skipped: { row: number; reason: string }[];
  skippedCount: number;
};

const emptyForm: FormState = {
  id: null,
  name: '',
  phone: '',
  max_guests: 1,
  group_name: '',
  invite_lamaran: false,
  invite_akad: true,
  invite_resepsi: true
};

const STATUS_STYLE: Record<GuestItem['rsvp_status'], { label: string; color: string }> = {
  attending: { label: 'Attending', color: '#8fd08f' },
  declined: { label: 'Declined', color: '#e8a0a0' },
  pending: { label: 'No reply yet', color: 'var(--adm-text-muted)' }
};

function linkFor(guest: GuestItem): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return base.replace(/\/+$/, '') + guest.path;
}

function whatsappUrl(guest: GuestItem, template: string, couple: string): string {
  const text = template
    .replaceAll('{name}', guest.name)
    .replaceAll('{couple}', couple || 'we')
    .replaceAll('{link}', linkFor(guest));
  // wa.me needs the number in international format without "+" or leading 0.
  const digits = (guest.phone ?? '').replace(/\D/g, '').replace(/^0/, '62');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [couple, setCouple] = useState('');
  const [template, setTemplate] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const toast = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [removeMissing, setRemoveMissing] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/guests').catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.success) {
      setGuests(data.data.guests);
      refreshAdminCounts();
      setCouple(data.data.couple);
      setTemplate((current) => current || data.data.inviteMessage);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(
    () => Array.from(new Set(guests.map((g) => g.group_name).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [guests]
  );

  const filtered = guests.filter((guest) => {
    if (groupFilter && guest.group_name !== groupFilter) return false;
    if (statusFilter && guest.rsvp_status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    return !q || guest.name.toLowerCase().includes(q) || (guest.phone ?? '').includes(q);
  });

  const stats = {
    invited: guests.length,
    seats: guests.reduce((sum, g) => sum + g.max_guests, 0),
    attending: guests.reduce((sum, g) => sum + (g.rsvp_status === 'attending' ? g.rsvp_guest_count ?? 0 : 0), 0),
    declined: guests.filter((g) => g.rsvp_status === 'declined').length,
    pending: guests.filter((g) => g.rsvp_status === 'pending').length
  };

  const saveGuest = async () => {
    if (!form) return;
    const { id, ...payload } = form;
    const res = await fetch(id ? `/api/guests/${id}` : '/api/guests', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => null);
    const data = await res?.json().catch(() => null);
    if (data?.success) {
      toast(id ? 'Guest updated.' : 'Guest added.');
      setForm(null);
      await load();
    } else {
      toast(friendlyError(data?.error, 'Failed to save the guest.'), 'error');
    }
  };

  const deleteGuest = async (guest: GuestItem) => {
    if (!window.confirm(`Delete ${guest.name}? Their personal link and RSVP will be removed.`)) return;
    const res = await fetch(`/api/guests/${guest.id}`, { method: 'DELETE' }).catch(() => null);
    toast(res?.ok ? `${guest.name} deleted.` : 'Failed to delete the guest.', res?.ok ? 'success' : 'error');
    if (res?.ok) await load();
  };

  const regenerateLink = async (guest: GuestItem) => {
    if (!window.confirm(`Create a new link for ${guest.name}? The old link will stop working.`)) return;
    const res = await fetch(`/api/guests/${guest.id}/token`, { method: 'POST' }).catch(() => null);
    toast(res?.ok ? `New link created for ${guest.name}.` : 'Failed to create a new link.', res?.ok ? 'success' : 'error');
    if (res?.ok) await load();
  };

  const copyLink = async (guest: GuestItem) => {
    await navigator.clipboard.writeText(linkFor(guest)).catch(() => undefined);
    setCopiedId(guest.id);
    setTimeout(() => setCopiedId((current) => (current === guest.id ? null : current)), 2000);
  };

  const saveTemplate = async () => {
    const res = await fetch('/api/guests/message', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_message: template })
    }).catch(() => null);
    toast(res?.ok ? 'WhatsApp message saved.' : 'Failed to save the message.', res?.ok ? 'success' : 'error');
  };

  const runImport = async () => {
    if (!importFile) return;
    if (removeMissing && !window.confirm('Guests that are not in this file will be deleted, with their RSVPs. Continue?')) return;
    setImporting(true);
    setImportResult(null);
    const body = new FormData();
    body.append('file', importFile);
    body.append('remove_missing', String(removeMissing));
    const res = await fetch('/api/guests/import', { method: 'POST', body }).catch(() => null);
    const data = await res?.json().catch(() => null);
    setImporting(false);
    if (data?.success) {
      setImportResult(data.data);
      toast('Import finished.');
      await load();
    } else {
      toast(data?.error || 'Import failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>Guest List</h2>
        <div className="flex flex-wrap gap-2">
          <a href="/api/guests/export?format=xlsx" className="admin-btn-outline">Export Excel</a>
          <a href="/api/guests/export?format=csv" className="admin-btn-outline">Export CSV</a>
          <button onClick={() => setForm({ ...emptyForm })} className="admin-btn-primary">+ Add Guest</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['Invited', stats.invited],
          ['Seats', stats.seats],
          ['Attending (people)', stats.attending],
          ['Declined', stats.declined],
          ['No reply yet', stats.pending]
        ].map(([label, value]) => (
          <div key={label} className="admin-card p-3">
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--adm-text-muted)' }}>{label}</p>
            <p className="mt-1 font-display text-2xl" style={{ color: '#C8DEC8' }}>{value}</p>
          </div>
        ))}
      </div>

      {form && (
        <div className="admin-card space-y-4 p-5">
          <h3 className="text-sm uppercase tracking-[0.2em]" style={{ color: '#C8DEC8' }}>
            {form.id ? 'Edit Guest' : 'Add Guest'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="admin-label">Name</span>
              <input className="admin-input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="admin-label">Phone (optional)</span>
              <input className="admin-input w-full" inputMode="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className="admin-label">Max guests</span>
              <input className="admin-input w-full" type="number" min={1} max={20} value={form.max_guests} onChange={(e) => setForm({ ...form, max_guests: Number(e.target.value) || 1 })} />
            </label>
            <label className="block">
              <span className="admin-label">Group (optional)</span>
              <input className="admin-input w-full" list="guest-groups" placeholder="Family, Office, ..." value={form.group_name} onChange={(e) => setForm({ ...form, group_name: e.target.value })} />
              <datalist id="guest-groups">
                {groups.map((group) => <option key={group} value={group} />)}
              </datalist>
            </label>
          </div>
          <div>
            <span className="admin-label">Invited to</span>
            <div className="mt-1 flex flex-wrap gap-4">
              {EVENT_TYPES.map((type) => {
                const key = `invite_${type}` as const;
                return (
                  <label key={type} className="flex items-center gap-2 text-sm" style={{ color: 'var(--adm-text)' }}>
                    <input type="checkbox" checked={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />
                    {eventTypeLabel(type)}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={saveGuest} className="admin-btn-primary">Save Guest</button>
            <button onClick={() => setForm(null)} className="admin-btn-outline">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="admin-card space-y-3 p-5">
          <h3 className="text-sm uppercase tracking-[0.2em]" style={{ color: '#C8DEC8' }}>Import Guests</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--adm-text-muted)' }}>
            Upload a .csv or .xlsx file with columns name, phone, max_guests, group, lamaran, akad, resepsi (yes/no).
            Existing guests are updated; their links stay the same.{' '}
            <a className="underline" href="/api/guests/export?format=xlsx&template=1">Download template</a>
          </p>
          <input
            type="file"
            accept=".csv,.xlsx"
            aria-label="Guest list file"
            onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
            style={{ color: 'var(--adm-text)' }}
          />
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
            <input type="checkbox" checked={removeMissing} onChange={(e) => setRemoveMissing(e.target.checked)} />
            Also delete guests that are not in this file
          </label>
          <button onClick={runImport} disabled={!importFile || importing} className="admin-btn-primary disabled:opacity-50">
            {importing ? 'Importing...' : 'Import'}
          </button>
          {importResult && (
            <div className="text-xs leading-relaxed" style={{ color: 'var(--adm-text)' }} data-testid="import-result">
              <p>
                Added {importResult.created} · Updated {importResult.updated} · Deleted {importResult.removed} · Skipped{' '}
                {importResult.skippedCount}
              </p>
              {importResult.skipped.length > 0 && (
                <ul className="mt-2 list-disc pl-5" style={{ color: '#e8a0a0' }}>
                  {importResult.skipped.map((item) => (
                    <li key={item.row}>Row {item.row}: {item.reason}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="admin-card space-y-3 p-5">
          <h3 className="text-sm uppercase tracking-[0.2em]" style={{ color: '#C8DEC8' }}>WhatsApp Message</h3>
          <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
            Used by the WhatsApp button. {'{name}'}, {'{couple}'} and {'{link}'} are filled in for each guest.
          </p>
          <textarea
            className="admin-input h-40 w-full resize-y"
            value={template}
            maxLength={1000}
            aria-label="WhatsApp message"
            onChange={(e) => setTemplate(e.target.value)}
          />
          <button onClick={saveTemplate} className="admin-btn-primary">Save Message</button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="admin-input flex-1"
          placeholder="Search name or phone"
          aria-label="Search guests"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="admin-input" aria-label="Filter by group" value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
          <option value="">All groups</option>
          {groups.map((group) => <option key={group} value={group}>{group}</option>)}
        </select>
        <select className="admin-input" aria-label="Filter by RSVP" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All replies</option>
          <option value="attending">Attending</option>
          <option value="declined">Declined</option>
          <option value="pending">No reply yet</option>
        </select>
      </div>

      {loaded && filtered.length === 0 && (
        <p className="admin-card p-6 text-center text-sm" style={{ color: 'var(--adm-text-muted)' }}>
          {guests.length === 0 ? 'No guests yet. Add a guest or import your guest list.' : 'No guests match these filters.'}
        </p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((guest) => {
          const statusStyle = STATUS_STYLE[guest.rsvp_status];
          return (
            <div key={guest.id} className="admin-card flex flex-col gap-3 p-4" data-testid="guest-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium" style={{ color: 'var(--adm-text)' }}>{guest.name}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
                    {[guest.group_name, guest.phone, `${guest.max_guests} ${guest.max_guests === 1 ? 'seat' : 'seats'}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <span className="shrink-0 text-xs" style={{ color: statusStyle.color }}>
                  {statusStyle.label}
                  {guest.rsvp_status === 'attending' && guest.rsvp_guest_count ? ` (${guest.rsvp_guest_count})` : ''}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.filter((type) => guest[`invite_${type}`]).map((type) => (
                  <span key={type} className="rounded-full px-2 py-0.5 text-[11px]" style={{ border: '1px solid var(--adm-border)', color: 'var(--adm-text-muted)' }}>
                    {eventTypeLabel(type)}
                  </span>
                ))}
              </div>
              {guest.rsvp_message && (
                <p className="break-words text-xs italic" style={{ color: 'var(--adm-text-muted)' }}>&ldquo;{guest.rsvp_message}&rdquo;</p>
              )}
              <div className="mt-auto flex flex-wrap gap-2">
                <button onClick={() => copyLink(guest)} className="admin-btn-outline">
                  {copiedId === guest.id ? 'Copied!' : 'Copy Link'}
                </button>
                <a href={whatsappUrl(guest, template, couple)} target="_blank" rel="noopener noreferrer" className="admin-btn-outline">
                  WhatsApp
                </a>
                <button
                  onClick={() =>
                    setForm({
                      id: guest.id,
                      name: guest.name,
                      phone: guest.phone ?? '',
                      max_guests: guest.max_guests,
                      group_name: guest.group_name,
                      invite_lamaran: guest.invite_lamaran,
                      invite_akad: guest.invite_akad,
                      invite_resepsi: guest.invite_resepsi
                    })
                  }
                  className="admin-btn-outline"
                >
                  Edit
                </button>
                <button onClick={() => regenerateLink(guest)} className="admin-btn-outline">New Link</button>
                <button onClick={() => deleteGuest(guest)} className="admin-btn-danger">Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
