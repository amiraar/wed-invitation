'use client';

import { useEffect, useState } from 'react';
import { defaultWedding } from '@/lib/defaults';
import type { BankAccount, WeddingConfig } from '@/lib/types';

const MAX_ACCOUNTS = 6;

const emptyAccount: BankAccount = { bank: '', account_number: '', account_name: '' };

export default function WeddingPage() {
  const [form, setForm] = useState<WeddingConfig>(defaultWedding);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/wedding')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setForm({ ...data.data, bank_accounts: data.data.bank_accounts ?? [] });
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

  const handleSave = async () => {
    const incomplete = form.bank_accounts.some(
      (account) => !account.bank.trim() || account.account_number.trim().length < 3 || !account.account_name.trim()
    );
    if (incomplete) {
      setStatus('Lengkapi semua kolom rekening (atau hapus baris yang kosong).');
      return;
    }

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
            placeholder="Nama panggilan pria"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.bride_name}
            onChange={(event) => handleChange('bride_name', event.target.value)}
            placeholder="Nama panggilan wanita"
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
            placeholder="Orang tua pria (cth: Bapak Fulan & Ibu Fulanah)"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.bride_parents}
            onChange={(event) => handleChange('bride_parents', event.target.value)}
            placeholder="Orang tua wanita (cth: Bapak Fulan & Ibu Fulanah)"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.cover_image_url}
            onChange={(event) => handleChange('cover_image_url', event.target.value)}
            placeholder="URL foto cover (hero)"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
          <input
            value={form.music_url}
            onChange={(event) => handleChange('music_url', event.target.value)}
            placeholder="URL musik (mp3)"
            className="rounded-xl border border-gray-200 px-3 py-2"
          />
        </div>
        <textarea
          value={form.opening_quote}
          onChange={(event) => handleChange('opening_quote', event.target.value)}
          placeholder="Kutipan pembuka (tampil di hero)"
          className="mt-4 h-24 w-full rounded-xl border border-gray-200 px-3 py-2"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Amplop Digital</h2>
            <p className="mt-1 text-sm text-gray-500">
              Rekening yang ditampilkan pada bagian &ldquo;Tanda Kasih&rdquo; di undangan.
            </p>
          </div>
          <button
            onClick={addAccount}
            disabled={form.bank_accounts.length >= MAX_ACCOUNTS}
            className="rounded-xl border border-amber-400 px-3 py-2 text-sm text-amber-600 disabled:opacity-50"
          >
            + Tambah Rekening
          </button>
        </div>

        {form.bank_accounts.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
            Belum ada rekening. Bagian amplop digital disembunyikan sampai minimal satu rekening
            ditambahkan.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {form.bank_accounts.map((account, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_1fr_1fr_auto]">
              <input
                value={account.bank}
                onChange={(event) => handleAccountChange(index, 'bank', event.target.value)}
                placeholder="Bank / e-wallet (cth: BCA)"
                className="rounded-xl border border-gray-200 px-3 py-2"
              />
              <input
                value={account.account_number}
                onChange={(event) => handleAccountChange(index, 'account_number', event.target.value)}
                placeholder="Nomor rekening"
                className="rounded-xl border border-gray-200 px-3 py-2"
              />
              <input
                value={account.account_name}
                onChange={(event) => handleAccountChange(index, 'account_name', event.target.value)}
                placeholder="Atas nama"
                className="rounded-xl border border-gray-200 px-3 py-2"
              />
              <button
                onClick={() => removeAccount(index)}
                className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-500"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="rounded-xl border border-amber-400 bg-amber-400 px-4 py-2 text-sm text-white"
        >
          Simpan
        </button>
        {status && <p className="text-sm text-gray-500">{status}</p>}
      </div>
    </div>
  );
}
