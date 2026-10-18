'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Toggle from '@/components/ui/Toggle';
import { useToast } from '@/components/admin/ToastProvider';
import { defaultSettings } from '@/lib/defaults';
import type { AppSettings } from '@/lib/types';

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="admin-card p-6">
      <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>{title}</h2>
      {description && <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-muted)' }}>{description}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetText, setResetText] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setSettings(data.data);
          setLoaded(true);
        } else {
          toast('Could not load settings. Please refresh the page.', 'error');
        }
      })
      .catch(() => toast('Could not load settings. Please refresh the page.', 'error'));
  }, [toast]);

  const handleSave = async () => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: settings.theme, show_gallery: settings.show_gallery, show_envelope: settings.show_envelope })
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    toast(data?.success ? 'Settings saved.' : data?.error || 'Failed to save settings.', data?.success ? 'success' : 'error');
  };

  const handleChangePassword = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const response = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (data?.success) {
      setCurrentPassword('');
      setNewPassword('');
    }
    toast(data?.success ? 'Password changed.' : data?.error || 'Failed to change password.', data?.success ? 'success' : 'error');
  };

  const handleReset = async () => {
    const response = await fetch('/api/reset', { method: 'POST' }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setResetText('');
    toast(data?.success ? 'All data has been reset.' : data?.error || 'Reset failed.', data?.success ? 'success' : 'error');
  };

  const themeButton = (theme: AppSettings['theme'], label: string) => (
    <button
      onClick={() => setSettings((prev) => ({ ...prev, theme }))}
      aria-pressed={settings.theme === theme}
      className="rounded-lg px-4 py-2 text-sm transition-all"
      style={
        settings.theme === theme
          ? { border: '1px solid var(--adm-accent)', background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
          : { border: '1px solid var(--adm-border)', color: 'var(--adm-text-muted)' }
      }
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <SectionCard title="Invitation Theme">
        <div className="flex items-center gap-4">
          {themeButton('light', 'Light')}
          {themeButton('dark', 'Dark')}
        </div>
      </SectionCard>

      <SectionCard
        title="Optional Sections"
        description="Events are shown or hidden in Events & Venues. Music is set in Couple & Story."
      >
        <div className="grid gap-4">
          {(
            [
              ['show_gallery', 'Gallery'],
              ['show_envelope', 'Gifts (bank accounts & wishlist)']
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>{label}</span>
              <Toggle label={label} checked={settings[key]} onChange={(value) => setSettings((prev) => ({ ...prev, [key]: value }))} />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs" style={{ color: 'var(--adm-text-faint)' }}>
          Story, rundown, dress code and FAQ appear automatically once they have content.{' '}
          <Link href="/admin/events" className="underline">Manage events</Link>
        </p>
      </SectionCard>

      <button onClick={handleSave} disabled={!loaded} className="admin-btn-primary disabled:opacity-50">
        Save Settings
      </button>

      <SectionCard title="Change Password">
        <form onSubmit={handleChangePassword} className="grid gap-3 md:max-w-sm">
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Current password"
            aria-label="Current password"
            className="admin-input"
          />
          <input
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={100}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="New password (min. 12 characters)"
            aria-label="New password"
            className="admin-input"
          />
          <button type="submit" className="admin-btn-primary">
            Change Password
          </button>
        </form>
      </SectionCard>

      <div className="admin-card mt-10 p-6" style={{ borderColor: 'var(--adm-danger-border)' }}>
        <h2 className="text-lg" style={{ color: 'var(--adm-danger)' }}>Danger Zone</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--adm-text-muted)' }}>
          Permanently deletes the guest list and personal links, all RSVPs, wishes, gallery photos and FAQs, clears every
          event&apos;s date and venue, and empties all couple, story, dress code, gift and music content. Settings go back to
          their defaults. This cannot be undone.
        </p>
        <label className="mt-4 block text-xs" style={{ color: 'var(--adm-text-muted)' }}>
          Type <strong>RESET</strong> to confirm
          <input
            value={resetText}
            onChange={(event) => setResetText(event.target.value)}
            className="admin-input mt-2 block w-full md:max-w-xs"
            aria-label="Type RESET to confirm"
          />
        </label>
        <button onClick={handleReset} disabled={resetText !== 'RESET'} className="admin-btn-danger mt-4 disabled:cursor-not-allowed disabled:opacity-40">
          Reset All Data
        </button>
      </div>
    </div>
  );
}
