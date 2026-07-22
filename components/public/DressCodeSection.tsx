'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import type { DressCodeSwatch } from '@/lib/types';

type Props = {
  title: string;
  note: string;
  avoidNote: string;
  swatches: DressCodeSwatch[];
};

export default function DressCodeSection({ title, note, avoidNote, swatches }: Props) {
  return (
    <section id="dresscode" className="section-anchor py-20 text-center md:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.p variants={fadeUpVariant} className="text-xs uppercase tracking-[0.4em] text-text-muted">
            Dress Code
          </motion.p>
          {title && (
            <motion.h2
              variants={fadeUpVariant}
              className="mt-3 font-display text-3xl italic md:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </motion.h2>
          )}
          {note && (
            <motion.p
              variants={fadeUpVariant}
              className="mx-auto mt-5 max-w-md text-sm leading-loose"
              style={{ color: 'var(--text-secondary)' }}
            >
              {note}
            </motion.p>
          )}

          {swatches.length > 0 && (
            <motion.div variants={fadeUpVariant} className="mt-12 flex flex-wrap justify-center gap-7">
              {swatches.map((swatch, index) => (
                <div key={`${swatch.label}-${index}`} className="flex flex-col items-center gap-3">
                  <div
                    className="h-14 w-14 rounded-full"
                    style={{ background: swatch.color, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted">{swatch.label}</span>
                </div>
              ))}
            </motion.div>
          )}

          {avoidNote && (
            <motion.div
              variants={fadeUpVariant}
              className="mt-11 inline-block px-9 py-4"
              style={{ border: '1px solid var(--border)' }}
            >
              <p className="text-xs tracking-[0.05em]" style={{ color: 'var(--text-secondary)' }}>
                {avoidNote}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
