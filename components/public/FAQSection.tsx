'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { FaqItem } from '@/lib/types';

type Props = {
  faqs: FaqItem[];
};

export default function FAQSection({ faqs }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section id="faq" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading align="center" eyebrow="Questions" title="Frequently Asked" />

          <div className="mt-12">
            {faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <motion.div key={faq.id} variants={fadeUpVariant} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : faq.id)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                      {faq.question}
                    </span>
                    <span
                      className="flex-shrink-0 text-xl leading-none"
                      style={{ color: 'var(--accent)' }}
                      aria-hidden
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="pb-5 text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
                      {faq.answer}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
