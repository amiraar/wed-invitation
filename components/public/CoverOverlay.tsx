'use client';

import { motion } from 'framer-motion';
import FancyButton from './FancyButton';

type Props = {
  coverTitle: string;
  coverSubtitle: string;
  groomName: string;
  brideName: string;
  guestName: string;
  showMusicHint: boolean;
  onOpen: () => void;
};

const curtainTransition = { duration: 1, ease: [0.76, 0, 0.24, 1] as const, delay: 0.2 };

// Rendered inside <AnimatePresence>: on open the content fades out first,
// then the two curtain halves slide apart to reveal the invitation.
export default function CoverOverlay({
  coverTitle,
  coverSubtitle,
  groomName,
  brideName,
  guestName,
  showMusicHint,
  onOpen
}: Props) {
  return (
    <motion.div className="fixed inset-0 z-[70] overflow-hidden" initial={false} exit={{}}>
      {/* Curtain halves */}
      <motion.div
        className="noise-bg absolute inset-y-0 left-0 w-1/2"
        style={{ background: 'var(--bg-primary)' }}
        exit={{ x: '-100%' }}
        transition={curtainTransition}
      />
      <motion.div
        className="noise-bg absolute inset-y-0 right-0 w-1/2"
        style={{ background: 'var(--bg-primary)' }}
        exit={{ x: '100%' }}
        transition={curtainTransition}
      />

      {/* Content */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)'
          }}
        />

        {[
          'top-6 left-6 border-t border-l',
          'top-6 right-6 border-t border-r',
          'bottom-6 left-6 border-b border-l',
          'bottom-6 right-6 border-b border-r'
        ].map((cls) => (
          <div
            key={cls}
            className={`pointer-events-none absolute h-12 w-12 sm:h-16 sm:w-16 ${cls}`}
            style={{ borderColor: 'var(--border)' }}
          />
        ))}

        <motion.p
          initial={{ opacity: 0, letterSpacing: '0.1em' }}
          animate={{ opacity: 1, letterSpacing: '0.4em' }}
          transition={{ duration: 1.5, delay: 0.3 }}
          className="text-xs uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {coverTitle}
        </motion.p>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: 'easeInOut' }}
          className="gold-divider my-6 w-40 sm:my-8 sm:w-48"
        />

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-light italic"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(2.75rem, 11vw, 6rem)',
            lineHeight: 1.05
          }}
        >
          {groomName || 'Nama'}
        </motion.h1>

        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="my-3 font-display text-3xl italic sm:my-4 sm:text-4xl"
          style={{ color: 'var(--accent)' }}
        >
          &amp;
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-light italic"
          style={{
            color: 'var(--text-primary)',
            fontSize: 'clamp(2.75rem, 11vw, 6rem)',
            lineHeight: 1.05
          }}
        >
          {brideName || 'Pasangan'}
        </motion.h1>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 1.4, ease: 'easeInOut' }}
          className="gold-divider my-6 w-40 sm:my-8 sm:w-48"
        />

        {guestName && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.55 }}
            className="mb-6"
          >
            <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--text-muted)' }}>
              Kepada Yth. Bapak/Ibu/Saudara/i
            </p>
            <p className="mt-2 font-display text-2xl italic" style={{ color: 'var(--text-secondary)' }}>
              {guestName}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.7 }}
        >
          <FancyButton onClick={onOpen}>{coverSubtitle || 'Buka Undangan'}</FancyButton>
        </motion.div>

        {showMusicHint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="mt-6 text-[10px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--text-muted)' }}
          >
            ♫ Musik akan diputar
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
