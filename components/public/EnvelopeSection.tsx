'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { BankAccount } from '@/lib/types';

type Props = {
  accounts: BankAccount[];
};

export default function EnvelopeSection({ accounts }: Props) {
  if (accounts.length === 0) return null;

  return (
    <section id="envelope" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="Amplop Digital"
            title="Tanda Kasih"
            description="Bagi Bapak/Ibu/Saudara/i yang ingin memberikan tanda kasih, dapat melalui rekening berikut."
          />

          <div className={`mt-10 grid gap-5 ${accounts.length > 1 ? 'md:grid-cols-2' : 'mx-auto max-w-md'}`}>
            {accounts.map((account, index) => (
              <motion.div key={`${account.bank}-${index}`} variants={fadeUpVariant}>
                <EnvelopeCard account={account} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function EnvelopeCard({ account }: { account: BankAccount }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context); the number stays visible.
    }
  };

  return (
    <div
      className="rounded-3xl p-6 text-center sm:p-8"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--accent)' }}>
        {account.bank}
      </div>
      <div
        className="mt-4 font-display text-2xl font-medium tracking-wider sm:text-3xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {account.account_number}
      </div>
      <div className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        a.n. {account.account_name}
      </div>
      <button
        onClick={handleCopy}
        className="mt-5 rounded-full border px-6 py-2.5 text-xs uppercase tracking-[0.3em] transition-colors duration-300 hover:bg-[var(--accent-dim)]"
        style={{ borderColor: 'var(--border-hover)', color: 'var(--accent)' }}
      >
        {copied ? 'Tersalin ✓' : 'Salin Nomor'}
      </button>
    </div>
  );
}
