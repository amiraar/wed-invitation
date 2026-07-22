'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import SectionHeading from './SectionHeading';
import type { BankAccount } from '@/lib/types';

type Props = {
  accounts: BankAccount[];
  wishlistTitle: string;
  wishlistNote: string;
};

export default function RegistrySection({ accounts, wishlistTitle, wishlistNote }: Props) {
  const hasWishlist = Boolean(wishlistTitle || wishlistNote);
  if (accounts.length === 0 && !hasWishlist) return null;

  return (
    <section id="registry" className="section-anchor py-20 md:py-28" style={{ background: 'var(--bg-secondary)' }}>
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="Registry & Gifts"
            title="With Gratitude"
            description="Your presence at our celebration is the most precious gift. Should you wish to honor us further, we've kept it simple."
          />

          <div className="mt-10 flex flex-wrap justify-center gap-5">
            {accounts.map((account, index) => (
              <motion.div key={`${account.bank}-${index}`} variants={fadeUpVariant} className="min-w-[260px] max-w-sm flex-1">
                <RegistryCard label="Gift Fund" title="Bank Transfer">
                  <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
                    {account.bank}
                    <br />
                    No. Rek: <BankAccountNumber account={account} />
                    <br />
                    a.n. {account.account_name}
                  </p>
                </RegistryCard>
              </motion.div>
            ))}

            {hasWishlist && (
              <motion.div variants={fadeUpVariant} className="min-w-[260px] max-w-sm flex-1">
                <RegistryCard label="Wishlist" title={wishlistTitle || 'Wishlist'}>
                  <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
                    {wishlistNote}
                  </p>
                </RegistryCard>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function RegistryCard({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <div className="h-full p-8 text-left" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>
        {label}
      </p>
      <p className="mt-3 font-display text-xl italic" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      <div className="my-4 h-px" style={{ background: 'var(--border)' }} />
      {children}
    </div>
  );
}

function BankAccountNumber({ account }: { account: BankAccount }) {
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
    <button
      onClick={handleCopy}
      className="font-medium underline-offset-2 hover:underline"
      style={{ color: 'var(--text-primary)' }}
      title="Copy account number"
    >
      {copied ? 'Copied ✓' : account.account_number}
    </button>
  );
}
