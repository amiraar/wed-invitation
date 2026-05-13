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
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Admin</p>
        <h1 className="text-lg font-semibold text-gray-800">Wedding Invitation</h1>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-full border border-gray-200 px-4 py-2 text-xs uppercase tracking-[0.3em] text-gray-600"
        disabled={loading}
      >
        {loading ? 'Logout...' : 'Logout'}
      </button>
    </header>
  );
}
