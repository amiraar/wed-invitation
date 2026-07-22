'use client';

import { useEffect, useState } from 'react';
import { defaultWedding } from '@/lib/defaults';
import type { BankAccount, DressCodeSwatch, ScheduleItem, WeddingConfig } from '@/lib/types';

const MAX_ACCOUNTS = 6;
const MAX_SWATCHES = 10;
const MAX_SCHEDULE_ITEMS = 20;

const emptyAccount: BankAccount = { bank: '', account_number: '', account_name: '' };
const emptySwatch: DressCodeSwatch = { color: '#7A9E7A', label: '' };
const emptyScheduleItem: ScheduleItem = { time: '', title: '', subtitle: '' };

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="admin-card p-6">
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

export default function WeddingPage() {
  const [form, setForm] = useState<WeddingConfig>(defaultWedding);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/wedding')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setForm({
            ...data.data,
            bank_accounts: data.data.bank_accounts ?? [],
            dress_code_swatches: data.data.dress_code_swatches ?? [],
            schedule_items: data.data.schedule_items ?? []
          });
        }
      })
      .catch(() => undefined);
  }, []);

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
      setStatus('Please complete all account fields (or remove empty rows).');
      return;
    }

    setStatus('Saving...');
    const response = await fetch('/api/wedding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Saved' : data?.error || 'Failed to save');
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Couple Details">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.groom_name}
            onChange={(event) => handleChange('groom_name', event.target.value)}
            placeholder="Groom's first name"
            className="admin-input"
          />
          <input
            value={form.bride_name}
            onChange={(event) => handleChange('bride_name', event.target.value)}
            placeholder="Bride's first name"
            className="admin-input"
          />
          <input
            value={form.groom_full_name}
            onChange={(event) => handleChange('groom_full_name', event.target.value)}
            placeholder="Groom's full name"
            className="admin-input"
          />
          <input
            value={form.bride_full_name}
            onChange={(event) => handleChange('bride_full_name', event.target.value)}
            placeholder="Bride's full name"
            className="admin-input"
          />
          <input
            value={form.groom_parents}
            onChange={(event) => handleChange('groom_parents', event.target.value)}
            placeholder="Groom's parents (e.g. Mr. Fulan & Mrs. Fulanah)"
            className="admin-input"
          />
          <input
            value={form.bride_parents}
            onChange={(event) => handleChange('bride_parents', event.target.value)}
            placeholder="Bride's parents (e.g. Mr. Fulan & Mrs. Fulanah)"
            className="admin-input"
          />
          <input
            value={form.cover_image_url}
            onChange={(event) => handleChange('cover_image_url', event.target.value)}
            placeholder="Cover photo URL (hero)"
            className="admin-input"
          />
          <input
            value={form.music_url}
            onChange={(event) => handleChange('music_url', event.target.value)}
            placeholder="Music URL (mp3)"
            className="admin-input"
          />
        </div>
      </SectionCard>

      <SectionCard title="Our Story" description="Shown in the Story section of the invitation.">
        <div className="grid gap-4">
          <div>
            <label className="admin-label">Pull Quote</label>
            <textarea
              value={form.opening_quote}
              onChange={(event) => handleChange('opening_quote', event.target.value)}
              placeholder="We met in a beautiful place..."
              className="admin-input h-20 w-full"
            />
          </div>
          <div>
            <label className="admin-label">Story Body</label>
            <textarea
              value={form.story_body}
              onChange={(event) => handleChange('story_body', event.target.value)}
              placeholder="Every great love story has a beginning..."
              className="admin-input h-28 w-full"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Schedule" description="The 'Order of Events' timeline shown on the invitation.">
        <div className="mb-3 flex items-center justify-end">
          <button onClick={addScheduleItem} disabled={form.schedule_items.length >= MAX_SCHEDULE_ITEMS} className="admin-btn-outline disabled:opacity-50">
            + Add Item
          </button>
        </div>

        {form.schedule_items.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
            No schedule items yet. The Schedule section stays hidden until at least one item is added.
          </p>
        )}

        <div className="space-y-3">
          {form.schedule_items.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-lg p-4 md:grid-cols-[120px_1fr_1fr_auto]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
              <input
                value={item.time}
                onChange={(event) => handleScheduleItemChange(index, 'time', event.target.value)}
                placeholder="09:00 AM"
                className="admin-input"
              />
              <input
                value={item.title}
                onChange={(event) => handleScheduleItemChange(index, 'title', event.target.value)}
                placeholder="Akad Nikah"
                className="admin-input"
              />
              <input
                value={item.subtitle}
                onChange={(event) => handleScheduleItemChange(index, 'subtitle', event.target.value)}
                placeholder="Sacred marriage ceremony"
                className="admin-input"
              />
              <button onClick={() => removeScheduleItem(index)} className="admin-btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Venue Photo" description="Shown alongside the venue details on the invitation.">
        <input
          value={form.venue_image_url}
          onChange={(event) => handleChange('venue_image_url', event.target.value)}
          placeholder="Venue photo URL"
          className="admin-input w-full"
        />
      </SectionCard>

      <SectionCard title="Dress Code">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="admin-label">Title</label>
            <input
              value={form.dress_code_title}
              onChange={(event) => handleChange('dress_code_title', event.target.value)}
              placeholder="Formal Attire"
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="admin-label">Avoid Note</label>
            <input
              value={form.dress_code_avoid_note}
              onChange={(event) => handleChange('dress_code_avoid_note', event.target.value)}
              placeholder="Please avoid white or black"
              className="admin-input w-full"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="admin-label">Description</label>
          <textarea
            value={form.dress_code_note}
            onChange={(event) => handleChange('dress_code_note', event.target.value)}
            className="admin-input h-20 w-full"
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="admin-label mb-0">Color Swatches</p>
          <button onClick={addSwatch} disabled={form.dress_code_swatches.length >= MAX_SWATCHES} className="admin-btn-outline disabled:opacity-50">
            + Add Swatch
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {form.dress_code_swatches.map((swatch, index) => (
            <div key={index} className="flex items-center gap-3 rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
              <input
                type="color"
                value={swatch.color}
                onChange={(event) => handleSwatchChange(index, 'color', event.target.value)}
                className="h-10 w-10 cursor-pointer rounded-full border-none bg-transparent"
              />
              <input
                value={swatch.label}
                onChange={(event) => handleSwatchChange(index, 'label', event.target.value)}
                placeholder="Sage"
                className="admin-input flex-1"
              />
              <button onClick={() => removeSwatch(index)} className="admin-btn-danger">
                ✕
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Registry & Gifts" description="Bank accounts shown in the Registry section.">
        <div className="mb-4 flex items-center justify-between">
          <span />
          <button onClick={addAccount} disabled={form.bank_accounts.length >= MAX_ACCOUNTS} className="admin-btn-outline disabled:opacity-50">
            + Add Account
          </button>
        </div>

        {form.bank_accounts.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
            No accounts yet. The Registry section stays hidden until at least one account is added.
          </p>
        )}

        <div className="space-y-3">
          {form.bank_accounts.map((account, index) => (
            <div key={index} className="grid gap-3 rounded-lg p-4 md:grid-cols-[1fr_1fr_1fr_auto]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--adm-border)' }}>
              <input
                value={account.bank}
                onChange={(event) => handleAccountChange(index, 'bank', event.target.value)}
                placeholder="Bank / e-wallet (e.g. BCA)"
                className="admin-input"
              />
              <input
                value={account.account_number}
                onChange={(event) => handleAccountChange(index, 'account_number', event.target.value)}
                placeholder="Account number"
                className="admin-input"
              />
              <input
                value={account.account_name}
                onChange={(event) => handleAccountChange(index, 'account_name', event.target.value)}
                placeholder="Account holder"
                className="admin-input"
              />
              <button onClick={() => removeAccount(index)} className="admin-btn-danger">
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="admin-label">Wishlist Title</label>
            <input
              value={form.wishlist_title}
              onChange={(event) => handleChange('wishlist_title', event.target.value)}
              placeholder="Home & Living"
              className="admin-input w-full"
            />
          </div>
          <div>
            <label className="admin-label">Wishlist Note</label>
            <input
              value={form.wishlist_note}
              onChange={(event) => handleChange('wishlist_note', event.target.value)}
              placeholder="We're building our first home together..."
              className="admin-input w-full"
            />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center gap-4">
        <button onClick={handleSave} className="admin-btn-primary">
          Save
        </button>
        {status && <p className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>{status}</p>}
      </div>
    </div>
  );
}
