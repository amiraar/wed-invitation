'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsData = { cover_title: string; cover_subtitle: string; theme: 'dark' | 'light' };
type WeddingData = { groom_name: string; bride_name: string };

export default function CoverPage() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    cover_title: 'We Are Getting Married',
    cover_subtitle: 'Sentuh untuk membuka undangan',
    theme: 'dark'
  });
  const [wedding, setWedding] = useState<WeddingData>({ groom_name: '', bride_name: '' });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(r => r.json()).catch(() => null),
      fetch('/api/wedding').then(r => r.json()).catch(() => null)
    ]).then(([s, w]) => {
      if (s?.success) setSettings(s.data);
      if (w?.success) setWedding(w.data);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light');
  }, [settings.theme]);

  const handleOpen = () => {
    setOpened(true);
    setTimeout(() => router.push('/invitation'), 1000);
  };

  const groomFirst = wedding.groom_name || 'Nama';
  const brideFirst = wedding.bride_name || 'Pasangan';

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden noise-bg"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(201,169,110,0.06) 0%, transparent 70%)'
        }}
      />

      {/* Decorative corner lines */}
      {[
        'top-8 left-8 border-t border-l',
        'top-8 right-8 border-t border-r',
        'bottom-8 left-8 border-b border-l',
        'bottom-8 right-8 border-b border-r'
      ].map((cls, i) => (
        <div
          key={i}
          className={`pointer-events-none absolute h-16 w-16 ${cls}`}
          style={{ borderColor: 'var(--border)' }}
        />
      ))}

      <AnimatePresence>
        {loaded && !opened && (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="relative z-10 flex flex-col items-center px-8 text-center"
          >
            {/* Label atas */}
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              animate={{ opacity: 1, letterSpacing: '0.4em' }}
              transition={{ duration: 1.5, delay: 0.3 }}
              className="text-xs uppercase"
              style={{ color: 'var(--text-muted)' }}
            >
              {settings.cover_title}
            </motion.p>

            {/* Garis ornamen atas */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: 'easeInOut' }}
              className="my-8 gold-divider w-48"
            />

            {/* Nama Pria */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-6xl font-light italic md:text-8xl"
              style={{ color: 'var(--text-primary)', lineHeight: 1 }}
            >
              {groomFirst}
            </motion.h1>

            {/* Ampersand */}
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="my-4 font-display text-4xl italic"
              style={{ color: 'var(--accent)' }}
            >
              &amp;
            </motion.span>

            {/* Nama Wanita */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-6xl font-light italic md:text-8xl"
              style={{ color: 'var(--text-primary)', lineHeight: 1 }}
            >
              {brideFirst}
            </motion.h1>

            {/* Garis ornamen bawah */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 1.4, ease: 'easeInOut' }}
              className="my-8 gold-divider w-48"
            />

            {/* Tombol buka */}
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.7 }}
              onClick={handleOpen}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative mt-4 overflow-hidden rounded-full border px-10 py-3.5 text-xs uppercase tracking-[0.35em] transition-all duration-500"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--bg-primary)]">
                {settings.cover_subtitle}
              </span>
              <span
                className="absolute inset-0 -translate-x-full bg-[var(--accent)] transition-transform duration-500 group-hover:translate-x-0"
              />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Curtain animation on open */}
      <AnimatePresence>
        {opened && (
          <>
            <motion.div
              className="absolute inset-y-0 left-0 z-20 w-1/2"
              style={{ background: 'var(--bg-primary)' }}
              initial={{ x: 0 }}
              animate={{ x: '-100%' }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            />
            <motion.div
              className="absolute inset-y-0 right-0 z-20 w-1/2"
              style={{ background: 'var(--bg-primary)' }}
              initial={{ x: 0 }}
              animate={{ x: '100%' }}
              transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
