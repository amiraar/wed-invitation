'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';

type Props = {
  quote: string;
  body: string;
};

export default function StorySection({ quote, body }: Props) {
  if (!quote && !body) return null;

  return (
    <section id="story" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <motion.p variants={fadeUpVariant} className="text-xs uppercase tracking-[0.4em] text-text-muted">
            Our Story
          </motion.p>
          <motion.h2
            variants={fadeUpVariant}
            className="mt-3 font-display text-3xl italic md:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            How It All Began
          </motion.h2>

          {quote && (
            <motion.div variants={fadeUpVariant} className="mt-11">
              <div
                className="font-display text-6xl leading-none"
                style={{ color: 'var(--border)' }}
                aria-hidden
              >
                &ldquo;
              </div>
              <p
                className="mt-5 font-display text-xl italic sm:text-2xl"
                style={{ color: 'var(--accent)', lineHeight: 1.65 }}
              >
                {quote}
              </p>
            </motion.div>
          )}

          {body && (
            <motion.div variants={fadeUpVariant} className="mt-9">
              <div className="mx-auto mb-8 flex items-center justify-center gap-4">
                <div className="h-px w-14 bg-[var(--border)]" />
                <div className="ornament-diamond text-[var(--accent)]" />
                <div className="h-px w-14 bg-[var(--border)]" />
              </div>
              <p className="text-sm leading-loose sm:text-base" style={{ color: 'var(--text-secondary)' }}>
                {body}
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
