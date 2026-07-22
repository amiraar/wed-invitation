'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';

type Props = {
  groomName: string;
  brideName: string;
  coverImageUrl: string;
  dateLabel: string;
  venueLine: string;
};

function Divider() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px w-16 bg-[var(--hero-text)]/30" />
      <div className="ornament-diamond text-[var(--hero-text)]/50" />
      <div className="h-px w-16 bg-[var(--hero-text)]/30" />
    </div>
  );
}

export default function HeroSection({ groomName, brideName, coverImageUrl, dateLabel, venueLine }: Props) {
  return (
    <section
      id="hero"
      className="section-anchor relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 text-center"
      style={{ background: 'var(--hero-bg)' }}
    >
      {coverImageUrl ? (
        <div className="absolute inset-0">
          <Image
            src={coverImageUrl}
            alt={`${groomName} & ${brideName}`}
            fill
            sizes="100vw"
            className="object-cover object-center opacity-40"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, var(--hero-bg) 10%, rgba(0,0,0,0.35) 60%)' }}
          />
        </div>
      ) : (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(245,240,230,0.05) 1px, transparent 1px)',
            backgroundSize: '38px 38px'
          }}
        />
      )}

      <motion.div
        className="relative z-10 flex flex-col items-center"
        variants={staggerContainerVariant}
        initial="hidden"
        animate="visible"
      >
        <motion.p
          variants={fadeUpVariant}
          className="mb-7 text-[11px] uppercase tracking-[0.5em] text-[var(--hero-text)]/65"
        >
          Wedding Invitation
        </motion.p>

        <motion.div variants={fadeUpVariant} className="mb-5">
          <Divider />
        </motion.div>

        <motion.h1
          variants={fadeUpVariant}
          className="font-display font-light italic text-[var(--hero-text)]"
          style={{ fontSize: 'clamp(2.75rem, 9vw, 6.75rem)', lineHeight: 0.95 }}
        >
          {groomName || 'The Groom'}
        </motion.h1>

        <motion.p
          variants={fadeUpVariant}
          className="my-3 text-[11px] uppercase tracking-[0.6em] text-[var(--hero-text)]/55"
        >
          and
        </motion.p>

        <motion.h1
          variants={fadeUpVariant}
          className="mb-7 font-display font-light italic text-[var(--hero-text)]"
          style={{ fontSize: 'clamp(2.75rem, 9vw, 6.75rem)', lineHeight: 0.95 }}
        >
          {brideName || 'The Bride'}
        </motion.h1>

        <motion.div variants={fadeUpVariant} className="mb-7">
          <Divider />
        </motion.div>

        {dateLabel && (
          <motion.p
            variants={fadeUpVariant}
            className="text-sm uppercase tracking-[0.35em] text-[var(--hero-text)]"
          >
            {dateLabel}
          </motion.p>
        )}

        {venueLine && (
          <motion.p
            variants={fadeUpVariant}
            className="mt-2 text-xs uppercase tracking-[0.3em] text-[var(--hero-text)]/55"
          >
            {venueLine}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        className="absolute bottom-9 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
        animate={{ y: [0, 8, 0], opacity: [0.55, 1, 0.55] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="h-9 w-px bg-gradient-to-b from-[var(--hero-text)]/45 to-transparent" />
        <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--hero-text)]/45">Scroll</p>
      </motion.div>
    </section>
  );
}
