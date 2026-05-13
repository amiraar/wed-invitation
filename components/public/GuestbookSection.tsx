'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GuestbookSchema } from '@/lib/validations';
import { z } from 'zod';
import type { GuestbookItem } from '@/lib/types';

const formSchema = GuestbookSchema;

type FormValues = z.infer<typeof formSchema>;

type Props = {
  messages: GuestbookItem[];
};

export default function GuestbookSection({ messages }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', message: '' }
  });

  const onSubmit = async (values: FormValues) => {
    setStatus('idle');
    setMessage('');
    const response = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const data = await response.json().catch(() => null);
    if (data?.success) {
      setStatus('success');
      setMessage('Ucapan sedang menunggu persetujuan.');
      reset();
    } else {
      setStatus('error');
      setMessage(data?.error || 'Terjadi kesalahan.');
    }
  };

  return (
    <section id="guestbook" className="section-anchor py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-display text-3xl italic">Ucapan</h2>
        <p className="mt-2 text-text-secondary">Kirimkan doa dan ucapan terbaik.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {messages.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-bg-card p-4">
                <p className="text-sm text-text-secondary">{item.message}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.3em] text-text-muted">{item.name}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-bg-card p-6">
            <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <input
                  {...register('name')}
                  className="w-full rounded-2xl border border-border bg-transparent px-4 py-3"
                  placeholder="Nama"
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
              </div>
              <div>
                <textarea
                  {...register('message')}
                  className="h-28 w-full rounded-2xl border border-border bg-transparent px-4 py-3"
                  placeholder="Tulis ucapan"
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-400">{errors.message.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="rounded-full border border-accent px-6 py-3 text-sm uppercase tracking-[0.3em] text-accent hover:bg-accent hover:text-bg-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
              </button>
              {status !== 'idle' && (
                <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
