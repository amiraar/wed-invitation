'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { ScheduleItem } from '@/lib/types';

type Props = {
  items: ScheduleItem[];
};

export default function ScheduleSection({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <section id="schedule" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading align="center" eyebrow="The Day" title="Order of Events" />

          <div className="relative mt-16 pl-12">
            <div
              className="absolute bottom-2 top-2 w-px"
              style={{ left: '19px', background: 'linear-gradient(to bottom, var(--border) 70%, transparent)' }}
            />
            {items.map((item, index) => (
              <motion.div key={index} variants={fadeUpVariant} className="relative mb-11 last:mb-0">
                <div
                  className="absolute -left-[39px] top-1.5 h-3 w-3 rounded-full"
                  style={{
                    background: 'var(--accent)',
                    border: '2px solid var(--bg-primary)',
                    boxShadow: '0 0 0 3px var(--border)'
                  }}
                />
                <p className="text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
                  {item.time}
                </p>
                <p className="mt-1 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {item.subtitle}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
