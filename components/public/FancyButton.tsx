'use client';

import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement>;

export default function FancyButton({ children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`group relative overflow-hidden rounded-full border px-10 py-3.5 text-xs uppercase tracking-[0.3em] transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
    >
      <span className="relative z-10 transition-colors duration-300 group-hover:text-[var(--bg-primary)]">
        {children}
      </span>
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-[var(--accent)] transition-transform duration-500 group-hover:translate-x-0"
      />
    </button>
  );
}
