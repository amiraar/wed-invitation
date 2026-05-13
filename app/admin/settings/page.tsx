'use client';

import { useEffect, useState } from 'react';
import Toggle from '@/components/ui/Toggle';
import type { AppSettings } from '@/lib/types';

const emptySettings: AppSettings = {
  id: 'main',
  theme: 'dark',
  cover_title: 'Kami Menikah',
  cover_subtitle: 'Buka undangan untuk melihat detail',
  show_lamaran: true,
  show_akad: true,
  show_resepsi: true,
  show_gallery: true,
  show_envelope: true,
  updated_at: ''
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
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
    setStatus('Menyimpan...');
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, music_autoplay: musicAutoplay })
    });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Tersimpan' : data?.error || 'Gagal menyimpan');
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setStatus('Klik sekali lagi untuk konfirmasi reset.');
      setTimeout(() => setConfirmReset(false), 5000);
      return;
    }

    setStatus('Mereset data...');
    const response = await fetch('/api/reset', { method: 'POST' });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Data berhasil direset.' : data?.error || 'Reset gagal');
    setConfirmReset(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Tema</h2>
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => setSettings((prev) => ({ ...prev, theme: 'dark' }))}
            className={`rounded-xl border px-4 py-2 text-sm ${
              settings.theme === 'dark' ? 'border-amber-400 bg-amber-100' : 'border-gray-200'
            }`}
          >
            Dark
          </button>
          <button
            onClick={() => setSettings((prev) => ({ ...prev, theme: 'light' }))}
            className={`rounded-xl border px-4 py-2 text-sm ${
              settings.theme === 'light' ? 'border-amber-400 bg-amber-100' : 'border-gray-200'
            }`}
          >
            Light
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Cover Page</h2>
        <div className="mt-4 grid gap-4">
          <input
            value={settings.cover_title}
            onChange={(event) => setSettings((prev) => ({ ...prev, cover_title: event.target.value }))}
            placeholder="Judul cover"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={settings.cover_subtitle}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, cover_subtitle: event.target.value }))
            }
            placeholder="Subjudul cover"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Section Visibility</h2>
        <div className="mt-4 grid gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Lamaran</span>
            <Toggle
              checked={settings.show_lamaran}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_lamaran: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Akad</span>
            <Toggle
              checked={settings.show_akad}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_akad: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Resepsi</span>
            <Toggle
              checked={settings.show_resepsi}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_resepsi: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Galeri</span>
            <Toggle
              checked={settings.show_gallery}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_gallery: value }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amplop</span>
            <Toggle
              checked={settings.show_envelope}
              onChange={(value) => setSettings((prev) => ({ ...prev, show_envelope: value }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Music Autoplay</h2>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">Aktifkan autoplay</span>
          <Toggle checked={musicAutoplay} onChange={setMusicAutoplay} />
        </div>
      </div>

      <button
        onClick={handleSave}
        className="rounded-xl border border-amber-400 bg-amber-400 px-4 py-2 text-sm text-white"
      >
        Simpan Pengaturan
      </button>
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
        <p className="mt-2 text-sm text-gray-600">Reset semua data RSVP, ucapan, galeri, dan pengaturan.</p>
        <button
          onClick={handleReset}
          className="mt-4 rounded-xl border border-red-400 bg-red-400 px-4 py-2 text-sm text-white"
        >
          {confirmReset ? 'Konfirmasi Reset' : 'Reset Semua Data'}
        </button>
      </div>
      {status && <p className="text-sm text-gray-500">{status}</p>}
    </div>
  );
}
