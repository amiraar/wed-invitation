'use client';

import { useState } from 'react';

type Props = {
  accounts: { bank: string; number: string; name: string }[];
};

export default function EnvelopeSection({ accounts }: Props) {
  return (
    <section id="envelope" className="section-anchor bg-bg-secondary py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="font-display text-3xl italic">Amplop Digital</h2>
        <p className="mt-2 text-text-secondary">Informasi rekening akan ditampilkan di sini.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {accounts.length === 0 && (
            <div className="rounded-2xl border border-border bg-bg-card p-6 text-sm text-text-muted">
              Belum ada rekening yang diatur.
            </div>
          )}
          {accounts.map((account, index) => (
            <EnvelopeCard key={`${account.bank}-${index}`} {...account} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EnvelopeCard({ bank, number, name }: { bank: string; number: string; name: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-3xl border border-border bg-bg-card p-6">
      <div className="text-xs uppercase tracking-[0.3em] text-text-muted">{bank}</div>
      <div className="mt-3 text-2xl font-semibold">{number}</div>
      <div className="mt-2 text-sm text-text-secondary">{name}</div>
      <button
        onClick={handleCopy}
        className="mt-4 rounded-full border border-accent px-4 py-2 text-xs uppercase tracking-[0.3em] text-accent"
      >
        {copied ? 'Tersalin' : 'Salin'}
      </button>
    </div>
  );
}
