'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { digitVariant, fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import type { EventItem } from '@/lib/types';

type Props = {
  events: EventItem[];
};

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
};

function formatCountdown(target: Date): Countdown {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: '00', hours: '00', minutes: '00' };
  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0')
  };
}

export default function EventsSection({ events }: Props) {
  const activeEvents = useMemo(() => events.filter((event) => event.is_active), [events]);
  const [ticks, setTicks] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTicks((prev) => prev + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="events" className="section-anchor bg-bg-secondary py-20">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.p variants={fadeUpVariant} className="text-xs uppercase tracking-[0.4em] text-text-muted">
            Rangkaian Acara
          </motion.p>
          <motion.h2 variants={fadeUpVariant} className="mt-3 font-display text-3xl italic">
            Jadwal dan Lokasi
          </motion.h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {activeEvents.map((event, index) => {
              const targetDate = event.event_date ? new Date(event.event_date) : new Date();
              const countdown = formatCountdown(targetDate);
              return (
                <motion.div
                  key={event.id}
                  variants={fadeUpVariant}
                  className="rounded-3xl border border-border bg-bg-card p-6 shadow-lg"
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-text-muted">{index + 1}</div>
                  <h3 className="mt-3 font-display text-2xl italic">{event.type}</h3>
                  <p className="mt-4 text-sm text-text-secondary">
                    {event.event_date || 'Tanggal belum diatur'}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {event.time_start || '--'} - {event.time_end || '--'}
                  </p>
                  <p className="mt-3 text-sm text-text-secondary">{event.venue_name || 'Lokasi TBD'}</p>
                  <p className="text-xs text-text-muted">{event.address || ''}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.3em] text-text-muted">
                    Dress Code: {event.dress_code || '-'}
                  </p>

                  <div className="mt-6 flex gap-4 text-center">
                    {(['days', 'hours', 'minutes'] as const).map((unit) => (
                      <div key={unit} className="flex-1 rounded-2xl border border-border bg-bg-secondary p-3">
                        <AnimatePresence mode="popLayout">
                          <motion.div
                            key={`${unit}-${countdown[unit]}-${ticks}`}
                            variants={digitVariant}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="text-lg font-semibold"
                          >
                            {countdown[unit]}
                          </motion.div>
                        </AnimatePresence>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-text-muted">
                          {unit}
                        </div>
                      </div>
                    ))}
                  </div>

                  {event.maps_url && (
                    <a
                      href={event.maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center text-sm text-accent"
                    >
                      Lihat Lokasi
                    </a>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
