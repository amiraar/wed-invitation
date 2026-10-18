'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { pageTitle } from './nav';

export default function Header({ menuOpen, onMenu }: { menuOpen: boolean; onMenu: () => void }) {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    window.location.href = '/admin/login';
  };

  return (
    <header
      className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
      style={{ background: 'var(--adm-bg-topbar)', borderBottom: '1px solid var(--adm-border)' }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenu}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="admin-nav"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg lg:hidden"
          style={{ border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}
        >
          <span aria-hidden="true" className="text-lg leading-none">☰</span>
        </button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--adm-text-faint)' }}>
            Admin
          </p>
          <h1 className="mt-0.5 truncate text-lg" style={{ color: 'var(--adm-text)' }}>
            {pageTitle(pathname)}
          </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn-outline hidden sm:inline-flex">
          View invitation ↗
        </a>
        <button onClick={handleLogout} className="admin-btn-outline" disabled={loading}>
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}
