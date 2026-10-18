'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant } from '@/lib/motion';
import { Sprig } from './Ornament';

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
      <motion.h2
        variants={fadeUpVariant}
        className="mt-3 font-display italic"
        style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', lineHeight: 1.15 }}
      >
        {title}
      </motion.h2>
      <motion.div
        variants={fadeUpVariant}
        className={`mt-3 ${centered ? 'flex justify-center' : ''}`}
        style={{ color: 'var(--accent-light)' }}
      >
        <Sprig className="h-4 w-20" />
      </motion.div>
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
