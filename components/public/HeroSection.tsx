'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';

type Props = {
  groomName: string;
  brideName: string;
  openingQuote: string;
  coverImageUrl: string;
  dateLabel: string;
  started: boolean;
};

// `started` gates the intro animation so it plays after the cover opens,
// not hidden behind it.
export default function HeroSection({
  groomName,
  brideName,
  openingQuote,
  coverImageUrl,
  dateLabel,
  started
}: Props) {
  return (
    <section
      id="hero"
      className="section-anchor relative flex min-h-dvh items-end overflow-hidden pb-20 sm:pb-24"
    >
      {/* Background image (slow settle-in zoom) or gradient */}
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={started ? { scale: 1 } : { scale: 1.12 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={`${groomName} & ${brideName}`}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-primary) 60%)'
            }}
          />
        )}
      </motion.div>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, var(--bg-primary) 0%, rgba(14,12,10,0.5) 40%, transparent 70%)'
        }}
      />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-5xl px-6 sm:px-8"
        variants={staggerContainerVariant}
        initial="hidden"
        animate={started ? 'visible' : 'hidden'}
      >
        <motion.p
          variants={fadeUpVariant}
          className="mb-6 text-xs uppercase tracking-[0.45em]"
          style={{ color: 'var(--text-secondary)' }}
        >
          The Wedding of
        </motion.p>

        <motion.h1
          variants={fadeUpVariant}
          className="font-display font-light italic"
          style={{ fontSize: 'clamp(2.75rem, 9vw, 6rem)', lineHeight: 1.1, color: 'var(--text-primary)' }}
        >
          <span className="block sm:inline">{groomName || 'Nama Pria'}</span>
          <span className="not-italic sm:mx-4" style={{ color: 'var(--accent)' }}>
            &amp;
          </span>
          <span className="block sm:inline">{brideName || 'Nama Wanita'}</span>
        </motion.h1>

        {dateLabel && (
          <motion.p
            variants={fadeUpVariant}
            className="mt-6 text-sm uppercase tracking-[0.3em]"
            style={{ color: 'var(--accent)' }}
          >
            {dateLabel}
          </motion.p>
        )}

        <motion.div variants={fadeUpVariant} className="gold-divider my-8 w-40 sm:w-64" />

        {openingQuote && (
          <motion.p
            variants={fadeUpVariant}
            className="max-w-xl font-display text-lg italic sm:text-xl"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
          >
            &ldquo;{openingQuote}&rdquo;
          </motion.p>
        )}

        <motion.div variants={fadeUpVariant} className="mt-12 flex items-center gap-4">
          <div className="gold-divider w-12" />
          <p className="animate-float text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
            Scroll
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
