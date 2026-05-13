'use client';

import { useEffect, useState } from 'react';
import type { WeddingConfig } from '@/lib/types';

const emptyWedding: WeddingConfig = {
  id: 'main',
  groom_name: '',
  bride_name: '',
  groom_full_name: '',
  bride_full_name: '',
  groom_parents: '',
  bride_parents: '',
  cover_image_url: '',
  music_url: '',
  music_autoplay: false,
  opening_quote: '',
  updated_at: ''
};

export default function WeddingPage() {
  const [form, setForm] = useState<WeddingConfig>(emptyWedding);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/wedding')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setForm(data.data);
      })
      .catch(() => undefined);
  }, []);

  const handleChange = (key: keyof WeddingConfig, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setStatus('Menyimpan...');
    const response = await fetch('/api/wedding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Tersimpan' : data?.error || 'Gagal menyimpan');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Data Pasangan</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={form.groom_name}
            onChange={(event) => handleChange('groom_name', event.target.value)}
            placeholder="Nama pria"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.bride_name}
            onChange={(event) => handleChange('bride_name', event.target.value)}
            placeholder="Nama wanita"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.groom_full_name}
            onChange={(event) => handleChange('groom_full_name', event.target.value)}
            placeholder="Nama lengkap pria"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.bride_full_name}
            onChange={(event) => handleChange('bride_full_name', event.target.value)}
            placeholder="Nama lengkap wanita"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.groom_parents}
            onChange={(event) => handleChange('groom_parents', event.target.value)}
            placeholder="Orang tua pria"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.bride_parents}
            onChange={(event) => handleChange('bride_parents', event.target.value)}
            placeholder="Orang tua wanita"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.cover_image_url}
            onChange={(event) => handleChange('cover_image_url', event.target.value)}
            placeholder="URL cover image"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.music_url}
            onChange={(event) => handleChange('music_url', event.target.value)}
            placeholder="URL musik"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
        <textarea
          value={form.opening_quote}
          onChange={(event) => handleChange('opening_quote', event.target.value)}
          placeholder="Opening quote"
          className="mt-4 h-24 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
        <button
          onClick={handleSave}
          className="mt-4 rounded-xl border border-amber-400 bg-amber-400 px-4 py-2 text-sm text-white"
        >
          Simpan
        </button>
        {status && <p className="mt-2 text-sm text-gray-500">{status}</p>}
      </div>
    </div>
  );
}
