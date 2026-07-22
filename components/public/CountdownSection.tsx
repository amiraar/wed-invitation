'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { digitVariant, fadeUpVariant } from '@/lib/motion';

type Props = {
  targetDate: Date | null;
  dateLabel: string;
};

type Countdown = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const unitLabels = { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' } as const;

function formatCountdown(target: Date, now: number): Countdown | null {
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400).toString().padStart(2, '0'),
    hours: Math.floor((totalSeconds % 86400) / 3600).toString().padStart(2, '0'),
    minutes: Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0'),
    seconds: (totalSeconds % 60).toString().padStart(2, '0')
  };
}

// Returns null until mounted so the server-rendered HTML never contains a
// clock value that would mismatch on hydration.
function useNow(): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

export default function CountdownSection({ targetDate, dateLabel }: Props) {
  const now = useNow();
  if (!targetDate) return null;

  const countdown = now !== null ? formatCountdown(targetDate, now) : null;
  const hasPassed = now !== null && targetDate.getTime() <= now;

  return (
    <section id="countdown" className="section-anchor py-20 text-center md:py-24" style={{ background: 'var(--bg-secondary)' }}>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-xs uppercase tracking-[0.4em] text-text-muted"
      >
        The Big Day
      </motion.p>

      {hasPassed ? (
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          transition={{ staggerChildren: 0.12, delayChildren: 0.1 }}
          className="mt-5 flex flex-col items-center gap-4"
        >
          <motion.div variants={fadeUpVariant} className="flex items-center gap-4">
            <div className="h-px w-14" style={{ background: 'var(--border)' }} />
            <div className="ornament-diamond" style={{ color: 'var(--accent)' }} />
            <div className="h-px w-14" style={{ background: 'var(--border)' }} />
          </motion.div>
          <motion.h2
            variants={fadeUpVariant}
            className="font-display text-3xl italic md:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            We Are Married ♥
          </motion.h2>
          <motion.p variants={fadeUpVariant} className="text-sm uppercase tracking-[0.3em]" style={{ color: 'var(--text-secondary)' }}>
            {dateLabel}
          </motion.p>
          <motion.p variants={fadeUpVariant} className="font-display text-xl italic" style={{ color: 'var(--accent)' }}>
            Thank you for your love and blessings
          </motion.p>
        </motion.div>
      ) : (
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          {(['days', 'hours', 'minutes', 'seconds'] as const).map((unit) => (
            <div key={unit} className="flex flex-col items-center gap-2.5">
              <div
                className="flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
              >
                <div className="h-11 overflow-hidden">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={countdown ? countdown[unit] : '--'}
                      variants={digitVariant}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      className="font-display text-4xl sm:text-5xl"
                      style={{ color: 'var(--text-primary)', lineHeight: 1 }}
                    >
                      {countdown ? countdown[unit] : '--'}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
                {unitLabels[unit]}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
