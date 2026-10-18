'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { formatTimeRange } from '@/lib/format';
import type { EventItem } from '@/lib/types';

type Props = {
  event: EventItem;
  imageUrl: string;
};

export default function VenueSection({ event, imageUrl }: Props) {
  const timeRange = formatTimeRange(event.time_start, event.time_end);

  return (
    <section id="venue" className="section-anchor py-20 md:py-28">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 md:flex-row md:items-center md:gap-16">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="w-full min-w-0 md:flex-1"
        >
          <motion.p variants={fadeUpVariant} className="text-xs uppercase tracking-[0.4em] text-text-muted">
            The Venue
          </motion.p>
          <motion.h2
            variants={fadeUpVariant}
            className="mt-3 font-display text-3xl italic md:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {event.venue_name || 'Our Celebration'}
          </motion.h2>
          <motion.div variants={fadeUpVariant} className="my-6 h-px w-10" style={{ background: 'var(--accent)' }} />
          {event.address && (
            <motion.p
              variants={fadeUpVariant}
              className="whitespace-pre-line text-sm leading-loose"
              style={{ color: 'var(--text-secondary)' }}
            >
              {event.address}
              {timeRange && `\nCeremony begins at ${timeRange}`}
            </motion.p>
          )}
          {event.maps_url && (
            <motion.a
              variants={fadeUpVariant}
              href={event.maps_url}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-block px-8 py-4 text-xs uppercase tracking-[0.3em] transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)', color: 'var(--hero-text)' }}
            >
              View on Map →
            </motion.a>
          )}
        </motion.div>

        {imageUrl && (
          <motion.div
            variants={fadeUpVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="relative h-64 w-full overflow-hidden sm:h-80 md:flex-1"
          >
            <Image src={imageUrl} alt={event.venue_name || 'Venue'} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
          </motion.div>
        )}
      </div>
    </section>
  );
}
