'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

type Props = {
  groomName: string;
  brideName: string;
  openingQuote: string;
  coverImageUrl: string;
};

export default function HeroSection({ groomName, brideName, openingQuote, coverImageUrl }: Props) {
  return (
    <section
      id="hero"
      className="section-anchor relative flex min-h-screen items-end pb-24 overflow-hidden"
    >
      {/* Background image or gradient */}
      <div className="absolute inset-0">
        {coverImageUrl ? (
          <Image src={coverImageUrl} alt="Couple" fill className="object-cover object-center" priority />
        ) : (
          <div
            style={{
              background: 'linear-gradient(160deg, var(--bg-elevated) 0%, var(--bg-primary) 60%)'
            }}
            className="h-full w-full"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, var(--bg-primary) 0%, rgba(14,12,10,0.5) 40%, transparent 70%)'
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-8">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-6 text-xs uppercase tracking-[0.45em]"
          style={{ color: 'var(--text-muted)' }}
        >
          The Wedding of
        </motion.p>

        {/* Names */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            className="font-display font-light italic"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.05, color: 'var(--text-primary)' }}
          >
            {groomName || 'Nama Pria'}
            <span className="mx-4 not-italic" style={{ color: 'var(--accent)' }}>&amp;</span>
            {brideName || 'Nama Wanita'}
          </h1>
        </motion.div>

        {/* Gold divider */}
        <motion.div
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.9, ease: 'easeInOut' }}
          className="my-8 gold-divider w-64"
        />

        {/* Quote */}
        {openingQuote && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="max-w-xl font-display text-xl italic"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
          >
            &ldquo;{openingQuote}&rdquo;
          </motion.p>
        )}

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mt-12 flex items-center gap-4"
        >
          <div className="gold-divider w-12" />
          <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--text-muted)' }}>
            Scroll
          </p>
        </motion.div>
      </div>
    </section>
  );
}
