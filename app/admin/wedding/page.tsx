'use client';

import { useEffect, useState } from 'react';
import Toggle from '@/components/ui/Toggle';
import { useToast } from '@/components/admin/ToastProvider';
import { defaultWedding, withScheduleDefaults } from '@/lib/defaults';
import { friendlyError } from '@/lib/fieldLabels';
import { eventTypeLabel, formatDateID } from '@/lib/format';
import type { BankAccount, DressCodeSwatch, EventItem, EventType, ScheduleItem, WeddingConfig } from '@/lib/types';

const MAX_ACCOUNTS = 6;
const MAX_SWATCHES = 10;
const MAX_SCHEDULE_ITEMS = 20;
const EVENT_TYPES: EventType[] = ['lamaran', 'akad', 'resepsi'];

const emptyAccount: BankAccount = { bank: '', account_number: '', account_name: '' };
const emptySwatch: DressCodeSwatch = { color: '#7A9E7A', label: '' };
const emptyScheduleItem: ScheduleItem = { event: 'all', time_start: '', time_end: '', title: '', subtitle: '' };

// Tells the admin which date a rundown item will appear under on the invitation.
function scheduleDateNote(item: ScheduleItem, events: EventItem[]): string {
  const legacy = item.time && !item.time_start ? ` Old time "${item.time}" is shown until you pick a start time.` : '';
  if (item.event === 'all') return `Shown to every guest, without a date.${legacy}`;
  const event = events.find((e) => e.type === item.event);
  const label = eventTypeLabel(item.event);
  if (event && !event.is_active) return `${label} is turned off in Events & Venues, so this item is hidden.${legacy}`;
  if (!event?.event_date) return `${label} has no date yet. Set it in Events & Venues.${legacy}`;
  return `${label} · ${formatDateID(event.event_date)}${legacy}`;
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="admin-card p-4 sm:p-6">
      <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>{title}</h2>
      {description && (
        <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-muted)' }}>
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="admin-label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px]" style={{ color: 'var(--adm-text-faint)' }}>{hint}</span>}
    </label>
  );
}

export default function WeddingPage() {
  const toast = useToast();
  const [form, setForm] = useState<WeddingConfig>(defaultWedding);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    fetch('/api/wedding')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setForm({
            ...data.data,
            bank_accounts: data.data.bank_accounts ?? [],
            dress_code_swatches: data.data.dress_code_swatches ?? [],
            schedule_items: (data.data.schedule_items ?? []).map(withScheduleDefaults)
          });
          // Saving is only possible once the real content is loaded, so empty defaults never overwrite it.
          setLoaded(true);
        } else {
          toast('Could not load the invitation content. Please refresh the page.', 'error');
        }
      })
      .catch(() => toast('Could not load the invitation content. Please refresh the page.', 'error'));
    // Only used to show each rundown item's date; the rundown still saves without it.
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setEvents(data.data);
      })
      .catch(() => undefined);
  }, [toast]);

  const handleChange = (key: keyof WeddingConfig, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAccountChange = (index: number, key: keyof BankAccount, value: string) => {
    setForm((prev) => {
      const accounts = prev.bank_accounts.map((account, i) =>
        i === index ? { ...account, [key]: value } : account
      );
      return { ...prev, bank_accounts: accounts };
    });
  };

  const addAccount = () => {
    setForm((prev) =>
      prev.bank_accounts.length >= MAX_ACCOUNTS
        ? prev
        : { ...prev, bank_accounts: [...prev.bank_accounts, { ...emptyAccount }] }
    );
  };

  const removeAccount = (index: number) => {
    setForm((prev) => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((_, i) => i !== index)
    }));
  };

  const handleSwatchChange = (index: number, key: keyof DressCodeSwatch, value: string) => {
    setForm((prev) => {
      const swatches = prev.dress_code_swatches.map((swatch, i) =>
        i === index ? { ...swatch, [key]: value } : swatch
      );
      return { ...prev, dress_code_swatches: swatches };
    });
  };

  const addSwatch = () => {
    setForm((prev) =>
      prev.dress_code_swatches.length >= MAX_SWATCHES
        ? prev
        : { ...prev, dress_code_swatches: [...prev.dress_code_swatches, { ...emptySwatch }] }
    );
  };

  const removeSwatch = (index: number) => {
    setForm((prev) => ({
      ...prev,
      dress_code_swatches: prev.dress_code_swatches.filter((_, i) => i !== index)
    }));
  };

  const handleScheduleItemChange = (index: number, key: keyof ScheduleItem, value: string) => {
    setForm((prev) => {
      const items = prev.schedule_items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
      return { ...prev, schedule_items: items };
    });
  };

  const addScheduleItem = () => {
    setForm((prev) =>
      prev.schedule_items.length >= MAX_SCHEDULE_ITEMS
        ? prev
        : { ...prev, schedule_items: [...prev.schedule_items, { ...emptyScheduleItem }] }
    );
  };

  const removeScheduleItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      schedule_items: prev.schedule_items.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    const incomplete = form.bank_accounts.some(
      (account) => !account.bank.trim() || account.account_number.trim().length < 3 || !account.account_name.trim()
    );
    if (incomplete) {
      toast('Please complete all bank account fields (or remove empty rows).', 'error');
      return;
    }

    setSaving(true);
    const response = await fetch('/api/wedding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSaving(false);
    toast(data?.success ? 'Invitation content saved.' : friendlyError(data?.error), data?.success ? 'success' : 'error');
  };

  return (
    // Fields stay disabled until the saved content has loaded, so nothing typed early gets replaced.
    <fieldset disabled={!loaded} className="m-0 min-w-0 space-y-6 border-0 p-0">
      <SectionCard title="Couple Details">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Groom's first name">
            <input value={form.groom_name} onChange={(e) => handleChange('groom_name', e.target.value)} placeholder="Groom's first name" className="admin-input w-full" />
          </Field>
          <Field label="Bride's first name">
            <input value={form.bride_name} onChange={(e) => handleChange('bride_name', e.target.value)} placeholder="Bride's first name" className="admin-input w-full" />
          </Field>
          <Field label="Groom's full name">
            <input value={form.groom_full_name} onChange={(e) => handleChange('groom_full_name', e.target.value)} placeholder="Groom's full name" className="admin-input w-full" />
          </Field>
          <Field label="Bride's full name">
            <input value={form.bride_full_name} onChange={(e) => handleChange('bride_full_name', e.target.value)} placeholder="Bride's full name" className="admin-input w-full" />
          </Field>
          <Field label="Groom's parents">
            <input value={form.groom_parents} onChange={(e) => handleChange('groom_parents', e.target.value)} placeholder="Mr. Fulan & Mrs. Fulanah" className="admin-input w-full" />
          </Field>
          <Field label="Bride's parents">
            <input value={form.bride_parents} onChange={(e) => handleChange('bride_parents', e.target.value)} placeholder="Mr. Fulan & Mrs. Fulanah" className="admin-input w-full" />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Media" description="Photos and music used on the invitation. Links must start with https://">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Cover photo URL" hint="Large photo at the top of the invitation.">
            <input value={form.cover_image_url} onChange={(e) => handleChange('cover_image_url', e.target.value)} placeholder="https://..." className="admin-input w-full" />
          </Field>
          <Field label="Venue photo URL" hint="Shown next to the venue details.">
            <input value={form.venue_image_url} onChange={(e) => handleChange('venue_image_url', e.target.value)} placeholder="https://..." className="admin-input w-full" />
          </Field>
          <Field label="Music URL (mp3)" hint="Plays in the background; guests can pause it.">
            <input value={form.music_url} onChange={(e) => handleChange('music_url', e.target.value)} placeholder="https://...mp3" className="admin-input w-full" />
          </Field>
          <div className="flex items-center justify-between gap-4 self-center rounded-lg px-3 py-3" style={{ border: '1px solid var(--adm-border)' }}>
            <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Start music automatically</span>
            <Toggle label="Start music automatically" checked={form.music_autoplay} onChange={(value) => handleChange('music_autoplay', value)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Our Story" description="Shown in the Story section of the invitation.">
        <div className="grid gap-4">
          <Field label="Pull quote">
            <textarea
              value={form.opening_quote}
              onChange={(event) => handleChange('opening_quote', event.target.value)}
              placeholder="We met in a beautiful place..."
              className="admin-input h-20 w-full"
            />
          </Field>
          <Field label="Story">
            <textarea
              value={form.story_body}
              onChange={(event) => handleChange('story_body', event.target.value)}
              placeholder="Every great love story has a beginning..."
              className="admin-input h-28 w-full"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        title="Rundown"
        description="The 'Order of Events' timeline. Link each item to an event: its date comes from Events & Venues, and guests only see items for events they are invited to."
      >
        <div className="mb-3 flex items-center justify-end">
          <button onClick={addScheduleItem} disabled={form.schedule_items.length >= MAX_SCHEDULE_ITEMS} className="admin-btn-outline disabled:opacity-50">
            + Add Item
          </button>
        </div>

        {form.schedule_items.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
            No rundown items yet. The rundown stays hidden until at least one item is added.
          </p>
        )}

        <div className="space-y-3">
          {form.schedule_items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                <Field label={`Item ${index + 1} · Event`}>
                  <select value={item.event} onChange={(e) => handleScheduleItemChange(index, 'event', e.target.value)} className="admin-input w-full">
                    <option value="all">General (every guest)</option>
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {eventTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Start time">
                  <input type="time" value={item.time_start} onChange={(e) => handleScheduleItemChange(index, 'time_start', e.target.value)} className="admin-input w-full" />
                </Field>
                <Field label="End time (optional)">
                  <input type="time" value={item.time_end} onChange={(e) => handleScheduleItemChange(index, 'time_end', e.target.value)} className="admin-input w-full" />
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Title">
                  <input value={item.title} onChange={(e) => handleScheduleItemChange(index, 'title', e.target.value)} placeholder="Akad Nikah" className="admin-input w-full" />
                </Field>
                <Field label="Description (optional)">
                  <input value={item.subtitle} onChange={(e) => handleScheduleItemChange(index, 'subtitle', e.target.value)} placeholder="Sacred marriage ceremony" className="admin-input w-full" />
                </Field>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }} data-testid={`rundown-date-${index}`}>
                  {scheduleDateNote(item, events)}
                </p>
                <button onClick={() => removeScheduleItem(index)} className="admin-btn-danger">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Dress Code">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input value={form.dress_code_title} onChange={(e) => handleChange('dress_code_title', e.target.value)} placeholder="Formal Attire" className="admin-input w-full" />
          </Field>
          <Field label="Avoid note">
            <input value={form.dress_code_avoid_note} onChange={(e) => handleChange('dress_code_avoid_note', e.target.value)} placeholder="Please avoid white or black" className="admin-input w-full" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Description">
            <textarea value={form.dress_code_note} onChange={(e) => handleChange('dress_code_note', e.target.value)} className="admin-input h-20 w-full" />
          </Field>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="admin-label mb-0">Colors</p>
          <button onClick={addSwatch} disabled={form.dress_code_swatches.length >= MAX_SWATCHES} className="admin-btn-outline disabled:opacity-50">
            + Add Color
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {form.dress_code_swatches.map((swatch, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
              <input
                type="color"
                value={swatch.color}
                onChange={(event) => handleSwatchChange(index, 'color', event.target.value)}
                aria-label={`Color ${index + 1}`}
                className="h-11 w-11 shrink-0 cursor-pointer rounded-full border-none bg-transparent"
              />
              <input
                value={swatch.label}
                onChange={(event) => handleSwatchChange(index, 'label', event.target.value)}
                placeholder="Sage"
                aria-label={`Color ${index + 1} name`}
                className="admin-input min-w-0 flex-1"
              />
              <button onClick={() => removeSwatch(index)} className="admin-btn-danger" aria-label={`Remove color ${index + 1}`}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Gifts" description="Bank accounts and wishlist shown in the Gifts section (turn it on or off in Settings).">
        <div className="mb-4 flex items-center justify-end">
          <button onClick={addAccount} disabled={form.bank_accounts.length >= MAX_ACCOUNTS} className="admin-btn-outline disabled:opacity-50">
            + Add Account
          </button>
        </div>

        {form.bank_accounts.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
            No accounts yet. The Gifts section stays hidden until at least one account or a wishlist note is added.
          </p>
        )}

        <div className="space-y-3">
          {form.bank_accounts.map((account, index) => (
            <div key={index} className="grid gap-3 rounded-lg p-4 lg:grid-cols-[1fr_1fr_1fr_auto]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
              <input value={account.bank} onChange={(e) => handleAccountChange(index, 'bank', e.target.value)} placeholder="Bank / e-wallet (e.g. BCA)" aria-label={`Account ${index + 1} bank`} className="admin-input" />
              <input value={account.account_number} onChange={(e) => handleAccountChange(index, 'account_number', e.target.value)} placeholder="Account number" aria-label={`Account ${index + 1} number`} className="admin-input" />
              <input value={account.account_name} onChange={(e) => handleAccountChange(index, 'account_name', e.target.value)} placeholder="Account holder" aria-label={`Account ${index + 1} holder`} className="admin-input" />
              <button onClick={() => removeAccount(index)} className="admin-btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Wishlist title">
            <input value={form.wishlist_title} onChange={(e) => handleChange('wishlist_title', e.target.value)} placeholder="Home & Living" className="admin-input w-full" />
          </Field>
          <Field label="Wishlist note">
            <input value={form.wishlist_note} onChange={(e) => handleChange('wishlist_note', e.target.value)} placeholder="We're building our first home together..." className="admin-input w-full" />
          </Field>
        </div>
      </SectionCard>

      <div className="sticky bottom-4 z-10 flex items-center gap-4">
        <button onClick={handleSave} disabled={!loaded || saving} className="admin-btn-primary shadow-lg disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </fieldset>
  );
}
