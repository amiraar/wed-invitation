'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { GuestbookSchema } from '@/lib/validations';
import { formatDateShortID } from '@/lib/format';
import { z } from 'zod';
import SectionHeading from './SectionHeading';
import FancyButton from './FancyButton';
import type { GuestbookItem } from '@/lib/types';

type FormValues = z.infer<typeof GuestbookSchema>;

type Props = {
  messages: GuestbookItem[];
};

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)'
} as const;

const inputClass =
  'w-full rounded-xl px-4 py-3.5 text-base sm:text-sm outline-none transition-all duration-300 focus:border-[var(--border-hover)]';

export default function GuestbookSection({ messages }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(GuestbookSchema),
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
      setMessage('Terima kasih! Ucapan Anda akan tampil setelah disetujui.');
      reset();
    } else {
      setStatus('error');
      setMessage(data?.error || 'Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  return (
    <section id="guestbook" className="section-anchor bg-bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="Buku Tamu"
            title="Doa & Ucapan"
            description="Kirimkan doa dan ucapan terbaik untuk kedua mempelai."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-5">
            <motion.div
              variants={fadeUpVariant}
              className="h-fit rounded-3xl p-6 md:col-span-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <input
                    {...register('name')}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="Nama Anda"
                    aria-label="Nama"
                    autoComplete="name"
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-red-400">Nama minimal 2 karakter.</p>}
                </div>
                <div>
                  <textarea
                    {...register('message')}
                    className={`${inputClass} h-32 resize-none`}
                    style={inputStyle}
                    placeholder="Tulis doa dan ucapan"
                    aria-label="Ucapan"
                  />
                  {errors.message && (
                    <p className="mt-1.5 text-xs text-red-400">Ucapan minimal 5 karakter.</p>
                  )}
                </div>
                <FancyButton type="submit" className="w-full py-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim...' : 'Kirim Ucapan'}
                </FancyButton>
                {status !== 'idle' && (
                  <p
                    role="status"
                    className={`text-center text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {message}
                  </p>
                )}
              </form>
            </motion.div>

            <motion.div variants={fadeUpVariant} className="md:col-span-3">
              {messages.length === 0 ? (
                <div
                  className="flex h-full min-h-[10rem] items-center justify-center rounded-3xl p-8 text-center text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  Belum ada ucapan. Jadilah yang pertama mengirim doa!
                </div>
              ) : (
                <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-1">
                  {messages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl p-5"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p
                          className="text-xs font-medium uppercase tracking-[0.25em]"
                          style={{ color: 'var(--accent)' }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="shrink-0 text-[11px]"
                          style={{ color: 'var(--text-muted)' }}
                          suppressHydrationWarning
                        >
                          {formatDateShortID(item.created_at)}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
