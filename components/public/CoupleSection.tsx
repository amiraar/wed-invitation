'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { WeddingConfig } from '@/lib/types';

type Props = {
  wedding: WeddingConfig;
};

export default function CoupleSection({ wedding }: Props) {
  const people = [
    {
      role: 'The Groom',
      parentsPrefix: 'Son of',
      name: wedding.groom_full_name || wedding.groom_name,
      parents: wedding.groom_parents
    },
    {
      role: 'The Bride',
      parentsPrefix: 'Daughter of',
      name: wedding.bride_full_name || wedding.bride_name,
      parents: wedding.bride_parents
    }
  ];

  if (!people.some((person) => person.name)) return null;

  return (
    <section id="couple" className="section-anchor bg-bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading align="center" eyebrow="Wedding Invitation" title="The Couple" />

          <div className="mt-12 grid items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-6">
            {people.map((person, index) => (
              <div key={person.role} className={index === 1 ? 'md:order-3' : ''}>
                <motion.div
                  variants={fadeUpVariant}
                  className="rounded-3xl p-8 text-center sm:p-10"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl italic"
                    style={{
                      border: '1px solid var(--border-hover)',
                      color: 'var(--accent)',
                      background: 'var(--accent-dim)'
                    }}
                  >
                    {(person.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <p className="mt-6 text-[11px] uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
                    {person.role}
                  </p>
                  <h3
                    className="mt-3 font-display text-2xl font-light italic sm:text-3xl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {person.name || '—'}
                  </h3>
                  {person.parents && (
                    <>
                      <div className="accent-divider mx-auto my-4 w-16" />
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                        {person.parentsPrefix}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {person.parents}
                      </p>
                    </>
                  )}
                </motion.div>
              </div>
            ))}

            <motion.div
              variants={fadeUpVariant}
              className="font-display text-5xl italic md:order-2"
              style={{ color: 'var(--accent)', textAlign: 'center' }}
              aria-hidden
            >
              &amp;
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
