'use client';

import { useEffect, useState } from 'react';
import Toggle from '@/components/ui/Toggle';
import { defaultSettings } from '@/lib/defaults';
import type { AppSettings } from '@/lib/types';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="admin-card p-6">
      <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [musicAutoplay, setMusicAutoplay] = useState(false);
  const [status, setStatus] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setSettings(data.data);
      })
      .catch(() => undefined);

    fetch('/api/wedding')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setMusicAutoplay(data.data.music_autoplay);
      })
      .catch(() => undefined);
  }, []);

  const handleSave = async () => {
    setStatus('Saving...');
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, music_autoplay: musicAutoplay })
    });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Saved' : data?.error || 'Failed to save');
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setStatus('Click once more to confirm reset.');
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }

    setStatus('Resetting data...');
    const response = await fetch('/api/reset', { method: 'POST' });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Data reset successfully.' : data?.error || 'Reset failed');
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Theme">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSettings((prev) => ({ ...prev, theme: 'light' }))}
            className="rounded-lg px-4 py-2 text-sm transition-all"
            style={
              settings.theme === 'light'
                ? { border: '1px solid var(--adm-accent)', background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
                : { border: '1px solid var(--adm-border)', color: 'var(--adm-text-muted)' }
            }
          >
            Light
          </button>
          <button
            onClick={() => setSettings((prev) => ({ ...prev, theme: 'dark' }))}
            className="rounded-lg px-4 py-2 text-sm transition-all"
            style={
              settings.theme === 'dark'
                ? { border: '1px solid var(--adm-accent)', background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
                : { border: '1px solid var(--adm-border)', color: 'var(--adm-text-muted)' }
            }
          >
            Dark
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Section Visibility">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Engagement</span>
            <Toggle
              checked={settings.show_lamaran}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_lamaran: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Akad</span>
            <Toggle
              checked={settings.show_akad}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_akad: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Reception</span>
            <Toggle
              checked={settings.show_resepsi}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_resepsi: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Gallery</span>
            <Toggle
              checked={settings.show_gallery}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_gallery: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Registry</span>
            <Toggle
              checked={settings.show_envelope}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_envelope: value }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Music Autoplay">
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>Enable autoplay</span>
          <Toggle checked={musicAutoplay} onChange={setMusicAutoplay} />
        </div>
      </SectionCard>

      <button onClick={handleSave} className="admin-btn-primary">
        Save Settings
      </button>

      <div className="admin-card p-6" style={{ borderColor: 'var(--adm-danger-border)' }}>
        <h2 className="text-lg" style={{ color: 'var(--adm-danger)' }}>Danger Zone</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--adm-text-muted)' }}>
          Reset all RSVP, guestbook, gallery, and settings data.
        </p>
        <button onClick={handleReset} className="admin-btn-danger mt-4">
          {confirmReset ? 'Confirm Reset' : 'Reset All Data'}
        </button>
      </div>
      {status && <p className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>{status}</p>}
    </div>
  );
}
