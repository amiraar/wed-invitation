'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { digitVariant, fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { eventTargetDate, eventTypeLabel, formatDateID, formatTimeRange } from '@/lib/format';
import SectionHeading from './SectionHeading';
import type { EventItem } from '@/lib/types';

type Props = {
  events: EventItem[];
};

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const romanNumerals = ['I', 'II', 'III'];
const unitLabels = { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' } as const;

function formatCountdown(target: Date, now: number): Countdown | null {
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0')
  };
}

// Returns null until mounted so the server-rendered HTML never contains a
// clock value that would mismatch on hydration.
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function EventsSection({ events }: Props) {
  const now = useNow();

  const gridClass =
    events.length >= 3
      ? 'md:grid-cols-3'
      : events.length === 2
        ? 'mx-auto max-w-4xl md:grid-cols-2'
        : 'mx-auto max-w-md';

  return (
    <section id="schedule" className="section-anchor py-20 md:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="The Day"
            title="Order of Events"
            description="It would be our greatest honor to have you join us."
          />

          <div className={`mt-12 grid gap-6 ${gridClass}`}>
            {events.map((event, index) => {
              const target = eventTargetDate(event);
              const countdown = target && now !== null ? formatCountdown(target, now) : null;
              const hasPassed = target !== null && now !== null && target.getTime() <= now;

              return (
                <motion.div
                  key={event.id}
                  variants={fadeUpVariant}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-border p-6 transition-all duration-500 hover:border-[var(--border-hover)] sm:p-8"
                  style={{ background: 'var(--bg-card)' }}
                >
                  <span
                    className="absolute right-6 top-4 font-display text-6xl italic opacity-10"
                    style={{ color: 'var(--accent)' }}
                    aria-hidden
                  >
                    {romanNumerals[index] ?? index + 1}
                  </span>

                  <h3 className="font-display text-2xl italic" style={{ color: 'var(--text-primary)' }}>
                    {eventTypeLabel(event.type)}
                  </h3>

                  <div className="mt-4 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <p>{formatDateID(event.event_date) || 'Date to be announced'}</p>
                    {formatTimeRange(event.time_start, event.time_end) && (
                      <p>At {formatTimeRange(event.time_start, event.time_end)}</p>
                    )}
                  </div>

                  {(event.venue_name || event.address) && (
                    <div className="mt-4">
                      {event.venue_name && (
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {event.venue_name}
                        </p>
                      )}
                      {event.address && (
                        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                          {event.address}
                        </p>
                      )}
                    </div>
                  )}

                  {event.dress_code && (
                    <p className="mt-4 text-xs uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
                      Dress Code: {event.dress_code}
                    </p>
                  )}

                  <div className="mt-auto pt-6">
                    {hasPassed ? (
                      <p
                        className="rounded-2xl p-3 text-center text-xs uppercase tracking-[0.3em]"
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        This event has passed
                      </p>
                    ) : (
                      target && (
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
                            <div
                              key={unit}
                              className="rounded-2xl px-1 py-3"
                              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                            >
                              <div className="h-7 overflow-hidden">
                                <AnimatePresence mode="popLayout" initial={false}>
                                  <motion.div
                                    key={countdown ? countdown[unit] : '--'}
                                    variants={digitVariant}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="text-lg font-semibold"
                                    style={{ color: 'var(--text-primary)' }}
                                  >
                                    {countdown ? countdown[unit] : '--'}
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                              <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                                {unitLabels[unit]}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {event.maps_url && (
                      <a
                        href={event.maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs uppercase tracking-[0.25em] transition-colors duration-300 hover:bg-[var(--accent-dim)]"
                        style={{ borderColor: 'var(--border-hover)', color: 'var(--accent)' }}
                      >
                        View Location
                        <span aria-hidden>↗</span>
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
