'use client';

import type { ReactNode } from 'react';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ open, title, onClose, children }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="admin-card w-full max-w-lg p-6" style={{ background: 'var(--adm-bg)' }}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>{title}</h3>
          <button onClick={onClose} className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
