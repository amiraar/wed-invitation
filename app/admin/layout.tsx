'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

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
    <div className="admin-shell">
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
