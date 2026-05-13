'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RSVPSchema } from '@/lib/validations';
import { z } from 'zod';

const formSchema = RSVPSchema;

type FormValues = z.infer<typeof formSchema>;

type Props = {
  events: { id: string; type: string }[];
};

export default function RSVPSection({ events }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      guest_count: 1,
      attending_lamaran: false,
      attending_akad: false,
      attending_resepsi: false,
      message: ''
    }
  });

  const onSubmit = async (values: FormValues) => {
    setStatus('idle');
    setMessage('');
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const data = await response.json().catch(() => null);
    if (data?.success) {
      setStatus('success');
      setMessage('Terima kasih! RSVP berhasil dikirim.');
      reset();
    } else {
      setStatus('error');
      setMessage(data?.error || 'Terjadi kesalahan.');
    }
  };

  return (
    <section id="rsvp" className="section-anchor bg-bg-secondary py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl border border-border bg-bg-card p-8 shadow-xl">
          <h2 className="font-display text-3xl italic">Konfirmasi Kehadiran</h2>
          <p className="mt-2 text-text-secondary">Mohon isi formulir RSVP.</p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <input
                {...register('name')}
                className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-all duration-300 focus:ring-1"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Nama lengkap"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div>
              <input
                {...register('phone')}
                className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-all duration-300 focus:ring-1"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Nomor HP"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
            </div>
            <div>
              <input
                type="number"
                min={1}
                max={10}
                {...register('guest_count', { valueAsNumber: true })}
                className="w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-all duration-300 focus:ring-1"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Jumlah tamu"
              />
              {errors.guest_count && (
                <p className="mt-1 text-xs text-red-400">{errors.guest_count.message}</p>
              )}
            </div>

            <div className="grid gap-2 text-sm text-text-secondary">
              {events.some((event) => event.type === 'lamaran') && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('attending_lamaran')} />
                  Hadir Lamaran
                </label>
              )}
              {events.some((event) => event.type === 'akad') && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('attending_akad')} />
                  Hadir Akad
                </label>
              )}
              {events.some((event) => event.type === 'resepsi') && (
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('attending_resepsi')} />
                  Hadir Resepsi
                </label>
              )}
            </div>

            <div>
              <textarea
                {...register('message')}
                className="h-28 w-full rounded-xl px-5 py-3.5 text-sm outline-none transition-all duration-300 focus:ring-1"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Pesan"
              />
            </div>

            <button
              type="submit"
              className="group relative w-full overflow-hidden rounded-full border py-4 text-xs uppercase tracking-[0.35em] transition-all duration-500"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
              disabled={isSubmitting}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--bg-primary)]">
                {isSubmitting ? 'Mengirim...' : 'Kirim RSVP'}
              </span>
              <span className="absolute inset-0 -translate-x-full bg-[var(--accent)] transition-transform duration-500 group-hover:translate-x-0" />
            </button>

            {status !== 'idle' && (
              <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
