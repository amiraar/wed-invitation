'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';
import ToastProvider from '@/components/admin/ToastProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  // The mobile drawer closes on navigation and with Escape.
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navOpen]);

  useEffect(() => {
    if (pathname.startsWith('/admin/login')) {
      setReady(true);
      return;
    }

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data?.success) {
          window.location.href = '/admin/login';
          return;
        }
        setReady(true);
      })
      .catch(() => {
        window.location.href = '/admin/login';
      });
  }, [pathname]);

  if (!ready) {
    return (
      <div className="admin-shell flex min-h-screen items-center justify-center text-sm" style={{ color: 'var(--adm-text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (pathname.startsWith('/admin/login')) {
    return <div className="admin-shell">{children}</div>;
  }

  return (
    <ToastProvider>
      <div className="admin-shell">
        <div className="flex">
          <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
          <div className="min-w-0 flex-1">
            <Header menuOpen={navOpen} onMenu={() => setNavOpen((open) => !open)} />
            <main className="p-4 sm:p-6">{children}</main>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
