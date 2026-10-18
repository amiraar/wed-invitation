'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { OrnamentDivider } from './Ornament';

type Props = {
  groomName: string;
  brideName: string;
  guestName: string | null;
  dateLabel: string;
  coverImageUrl: string;
  showMusicHint: boolean;
  onOpen: () => void;
};

const curtainTransition = { duration: 1, ease: [0.76, 0, 0.24, 1] as const, delay: 0.25 };

// Opening card shown before the invitation. Rendered inside <AnimatePresence>: on open the content
// fades out, then the two halves slide apart. Opening is a user gesture, so music may start here.
export default function CoverOverlay({ groomName, brideName, guestName, dateLabel, coverImageUrl, showMusicHint, onOpen }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus the button so keyboard users can open with Enter right away.
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <motion.div
      data-cover
      role="dialog"
      aria-modal="true"
      aria-label="Invitation cover"
      className="fixed inset-0 z-[70] overflow-hidden"
      initial={false}
      exit={{}}
    >
      {/* Without JavaScript the cover could never be opened, so it is hidden. */}
      <noscript>
        <style>{'[data-cover]{display:none!important}'}</style>
      </noscript>

      <motion.div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ background: 'var(--hero-bg)' }}
        exit={{ x: '-100%' }}
        transition={curtainTransition}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ background: 'var(--hero-bg)' }}
        exit={{ x: '100%' }}
        transition={curtainTransition}
      />

      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {coverImageUrl && (
          <div className="pointer-events-none absolute inset-0">
            <Image src={coverImageUrl} alt="" fill sizes="100vw" className="object-cover opacity-25" priority />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25), var(--hero-bg) 85%)' }} />
          </div>
        )}

        {['left-5 top-5 border-l border-t', 'right-5 top-5 border-r border-t', 'bottom-5 left-5 border-b border-l', 'bottom-5 right-5 border-b border-r'].map((cls) => (
          <div key={cls} className={`pointer-events-none absolute h-12 w-12 border-hero-text/25 sm:h-16 sm:w-16 ${cls}`} />
        ))}

        <div className="relative flex flex-col items-center">
          <motion.p
            initial={{ opacity: 0, letterSpacing: '0.15em' }}
            animate={{ opacity: 1, letterSpacing: '0.4em' }}
            transition={{ duration: 1.4, delay: 0.2 }}
            className="text-xs uppercase text-hero-text/70"
          >
            The Wedding of
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 break-words font-display font-light italic text-hero-text"
            style={{ fontSize: 'clamp(2.5rem, 10vw, 5.25rem)', lineHeight: 1.05 }}
          >
            {groomName || 'The Groom'}
            <span className="mx-3 inline-block text-[0.6em] text-hero-text/70">&amp;</span>
            {brideName || 'The Bride'}
          </motion.h1>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.9 }}>
            <OrnamentDivider className="my-6 text-hero-text/60" />
          </motion.div>

          {dateLabel && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs uppercase tracking-[0.35em] text-hero-text/75"
            >
              {dateLabel}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.2 }}
            className="mt-9"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-hero-text/60">Kepada Yth.</p>
            <p className="mt-2 break-words font-display text-2xl italic text-hero-text sm:text-3xl">
              {guestName || 'Bapak/Ibu/Saudara/i'}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.4 }}>
            <button
              ref={buttonRef}
              onClick={onOpen}
              className="mt-9 rounded-full border border-hero-text/40 px-10 py-3.5 text-xs uppercase tracking-[0.3em] text-hero-text transition-colors duration-300 hover:bg-hero-text/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hero-text/60"
            >
              Open Invitation
            </button>
          </motion.div>

          {showMusicHint && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-5 text-xs uppercase tracking-[0.3em] text-hero-text/50"
            >
              ♫ Music will play
            </motion.p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
