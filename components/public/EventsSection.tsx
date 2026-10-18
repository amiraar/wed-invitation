'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { eventTypeLabel, formatDateID, formatTimeRange } from '@/lib/format';
import SectionHeading from './SectionHeading';
import type { EventItem } from '@/lib/types';

type Props = {
  // Shown events (and, on a personal link, only the ones the guest is invited to).
  events: EventItem[];
  imageUrl: string;
};

const GRID_BY_COUNT: Record<number, string> = {
  1: 'mx-auto max-w-md',
  2: 'mx-auto max-w-3xl md:grid-cols-2'
};

// One card per event, so what the couple fills in under Events & Venues maps 1:1 to the page.
export default function EventsSection({ events, imageUrl }: Props) {
  return (
    <section id="events" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div variants={staggerContainerVariant} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
          <SectionHeading align="center" eyebrow="Save the Date" title="Wedding Events" />

          {imageUrl && (
            <motion.div variants={fadeUpVariant} className="relative mt-10 h-52 overflow-hidden rounded-3xl sm:h-72">
              <Image src={imageUrl} alt="Venue" fill sizes="(min-width: 1024px) 64rem, 100vw" className="object-cover" />
            </motion.div>
          )}

          <div className={`mt-10 grid gap-5 ${GRID_BY_COUNT[events.length] ?? 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {events.map((event) => {
              const timeRange = formatTimeRange(event.time_start, event.time_end);
              return (
                <motion.article
                  key={event.id}
                  variants={fadeUpVariant}
                  className="flex flex-col rounded-3xl p-7 text-center"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
                >
                  <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
                    {eventTypeLabel(event.type)}
                  </p>
                  {event.event_date && (
                    <h3 className="mt-3 font-display text-2xl italic" style={{ color: 'var(--text-primary)' }}>
                      {formatDateID(event.event_date)}
                    </h3>
                  )}
                  {timeRange && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--accent)' }}>
                      {timeRange}
                    </p>
                  )}
                  <div className="mx-auto my-5 h-px w-10" style={{ background: 'var(--border-hover)' }} />
                  {event.venue_name && (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {event.venue_name}
                    </p>
                  )}
                  {event.address && (
                    <p className="mt-1 whitespace-pre-line break-words text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {event.address}
                    </p>
                  )}
                  {event.dress_code && (
                    <p className="mt-4 text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                      Dress code: <span style={{ color: 'var(--text-secondary)' }}>{event.dress_code}</span>
                    </p>
                  )}
                  {event.maps_url && (
                    <div className="mt-auto pt-6">
                      <a
                        href={event.maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block rounded-full px-7 py-3 text-xs uppercase tracking-[0.3em] transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent)', color: 'var(--hero-text)' }}
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
