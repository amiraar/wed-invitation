'use client';

import { useState } from 'react';

export default function Header() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ background: 'var(--adm-bg-topbar)', borderBottom: '1px solid var(--adm-border)' }}
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--adm-text-faint)' }}>
          Admin
        </p>
        <h1 className="mt-0.5 text-lg" style={{ color: 'var(--adm-text)' }}>
          Wedding Invitation
        </h1>
      </div>
      <button onClick={handleLogout} className="admin-btn-outline" disabled={loading}>
        {loading ? 'Logging out...' : 'Logout'}
      </button>
    </header>
  );
}
