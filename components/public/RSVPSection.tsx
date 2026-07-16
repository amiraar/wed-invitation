'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { RSVPSchema } from '@/lib/validations';
import { eventTypeLabel } from '@/lib/format';
import { z } from 'zod';
import SectionHeading from './SectionHeading';
import FancyButton from './FancyButton';
import type { EventItem } from '@/lib/types';

type FormValues = z.infer<typeof RSVPSchema>;

type Props = {
  events: Pick<EventItem, 'id' | 'type'>[];
};

const attendanceFieldByType = {
  lamaran: 'attending_lamaran',
  akad: 'attending_akad',
  resepsi: 'attending_resepsi'
} as const;

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)'
} as const;

const inputClass =
  'w-full rounded-xl px-4 py-3.5 text-base sm:text-sm outline-none transition-all duration-300 focus:border-[var(--border-hover)]';

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] uppercase tracking-[0.25em]"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </label>
  );
}

export default function RSVPSection({ events }: Props) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(RSVPSchema),
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
      setMessage('Terima kasih! Konfirmasi kehadiran Anda berhasil dikirim.');
      reset();
    } else {
      setStatus('error');
      setMessage(data?.error || 'Terjadi kesalahan. Silakan coba lagi.');
    }
  };

  return (
    <section id="rsvp" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="RSVP"
            title="Konfirmasi Kehadiran"
            description="Mohon konfirmasi kehadiran Anda untuk membantu kami mempersiapkan acara."
          />

          <motion.div
            variants={fadeUpVariant}
            className="mt-10 rounded-3xl p-6 sm:p-8"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
          >
            <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <FieldLabel htmlFor="rsvp-name">Nama Lengkap</FieldLabel>
                <input
                  id="rsvp-name"
                  {...register('name')}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Nama Anda"
                  autoComplete="name"
                />
                {errors.name && <p className="mt-1.5 text-xs text-red-400">Nama minimal 2 karakter.</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="rsvp-phone">Nomor HP</FieldLabel>
                  <input
                    id="rsvp-phone"
                    {...register('phone')}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="08xxxxxxxxxx"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {errors.phone && <p className="mt-1.5 text-xs text-red-400">Format nomor HP tidak valid.</p>}
                </div>
                <div>
                  <FieldLabel htmlFor="rsvp-guests">Jumlah Tamu</FieldLabel>
                  <input
                    id="rsvp-guests"
                    type="number"
                    min={1}
                    max={10}
                    {...register('guest_count', { valueAsNumber: true })}
                    className={inputClass}
                    style={inputStyle}
                  />
                  {errors.guest_count && <p className="mt-1.5 text-xs text-red-400">Antara 1 sampai 10 tamu.</p>}
                </div>
              </div>

              {events.length > 0 && (
                <fieldset>
                  <legend
                    className="mb-2 block text-[11px] uppercase tracking-[0.25em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Saya Akan Hadir Di
                  </legend>
                  <div className="grid gap-2">
                    {events.map((event) => (
                      <label
                        key={event.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3.5 text-sm transition-colors duration-300 hover:border-[var(--border-hover)]"
                        style={inputStyle}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0"
                          {...register(attendanceFieldByType[event.type])}
                        />
                        <span style={{ color: 'var(--text-secondary)' }}>{eventTypeLabel(event.type)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              <div>
                <FieldLabel htmlFor="rsvp-message">Pesan (Opsional)</FieldLabel>
                <textarea
                  id="rsvp-message"
                  {...register('message')}
                  className={`${inputClass} h-28 resize-none`}
                  style={inputStyle}
                  placeholder="Tulis pesan untuk kami"
                />
              </div>

              <FancyButton type="submit" className="w-full py-4" disabled={isSubmitting}>
                {isSubmitting ? 'Mengirim...' : 'Kirim RSVP'}
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
        </motion.div>
      </div>
    </section>
  );
}
