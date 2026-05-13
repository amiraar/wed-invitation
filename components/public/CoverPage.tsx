'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { curtainVariant } from '@/lib/motion';

type SettingsData = {
  cover_title: string;
  cover_subtitle: string;
  theme: 'dark' | 'light';
};

type WeddingData = {
  groom_name: string;
  bride_name: string;
};

export default function CoverPage() {
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    cover_title: 'Kami Menikah',
    cover_subtitle: 'Buka undangan untuk melihat detail',
    theme: 'dark'
  });
  const [wedding, setWedding] = useState<WeddingData>({
    groom_name: '',
    bride_name: ''
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setSettings(data.data);
      })
      .catch(() => undefined);

    fetch('/api/wedding')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setWedding({
            groom_name: data.data.groom_name,
            bride_name: data.data.bride_name
          });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light');
    document.documentElement.classList.toggle('theme-dark', settings.theme !== 'light');
  }, [settings.theme]);

  const handleOpen = () => {
    setOpened(true);
    setTimeout(() => {
      router.push('/invitation');
    }, 900);
  };

  const coupleName = `${wedding.groom_name} & ${wedding.bride_name}`.trim();

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg-primary text-text-primary noise-bg">
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="cover"
            className="relative z-10 mx-6 w-full max-w-3xl rounded-3xl border border-border bg-bg-card/60 p-10 text-center shadow-2xl backdrop-blur"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-text-muted">{settings.cover_title}</p>
            <h1 className="font-display text-4xl italic md:text-6xl">{coupleName || 'Nama Pasangan'}</h1>
            <p className="mt-4 text-text-secondary">{settings.cover_subtitle}</p>
            <button
              onClick={handleOpen}
              className="mt-8 inline-flex items-center justify-center rounded-full border border-accent px-8 py-3 text-sm uppercase tracking-[0.3em] text-accent transition hover:bg-accent hover:text-bg-primary"
            >
              Buka Undangan
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && (
          <>
            <motion.div
              className="absolute inset-0 z-20 w-1/2 bg-bg-card"
              custom="left"
              variants={curtainVariant}
              initial="initial"
              animate="exit"
            />
            <motion.div
              className="absolute inset-y-0 right-0 z-20 w-1/2 bg-bg-card"
              custom="right"
              variants={curtainVariant}
              initial="initial"
              animate="exit"
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
