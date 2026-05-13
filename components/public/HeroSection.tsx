'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { fadeUpVariant } from '@/lib/motion';

type Props = {
  groomName: string;
  brideName: string;
  openingQuote: string;
  coverImageUrl: string;
};

export default function HeroSection({ groomName, brideName, openingQuote, coverImageUrl }: Props) {
  return (
    <section id="hero" className="section-anchor relative flex min-h-screen items-center">
      <div className="absolute inset-0">
        {coverImageUrl ? (
          <Image src={coverImageUrl} alt="Couple" fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-bg-secondary to-bg-primary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/70 via-bg-primary/40 to-bg-primary" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 text-center">
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="text-sm uppercase tracking-[0.35em] text-text-muted"
        >
          The Wedding Of
        </motion.p>
        <motion.h1
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="mt-4 font-display text-5xl italic md:text-7xl"
        >
          {groomName} &amp; {brideName}
        </motion.h1>
        <motion.p
          variants={fadeUpVariant}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-6 max-w-2xl text-text-secondary"
        >
          {openingQuote || 'Kami mengundang Anda untuk merayakan hari bahagia kami.'}
        </motion.p>
        <div className="mt-12 flex justify-center">
          <div className="h-10 w-px bg-accent/50" />
        </div>
        <div className="mt-4 animate-bounce text-xs uppercase tracking-[0.4em] text-text-muted">Scroll</div>
      </div>
    </section>
  );
}
