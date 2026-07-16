'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant } from '@/lib/motion';

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
};

// Must be rendered inside a motion container using staggerContainerVariant.
export default function SectionHeading({ eyebrow, title, description, align = 'left' }: Props) {
  const centered = align === 'center';
  return (
    <div className={centered ? 'text-center' : 'text-left'}>
      <motion.p variants={fadeUpVariant} className="text-xs uppercase tracking-[0.4em] text-text-muted">
        {eyebrow}
      </motion.p>
      <motion.h2 variants={fadeUpVariant} className="mt-3 font-display text-3xl italic md:text-4xl">
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUpVariant}
          className={`mt-3 max-w-md text-sm text-text-secondary md:text-base ${centered ? 'mx-auto' : ''}`}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
