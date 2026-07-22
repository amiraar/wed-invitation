'use client';

import { useState } from 'react';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json().catch(() => null);
    if (data?.success) {
      window.location.href = '/admin/dashboard';
      return;
    }

    setError(data?.error || 'Login failed.');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'var(--adm-bg)' }}>
      <div className="admin-card w-full max-w-md p-8">
        <h1 className="font-display text-2xl italic" style={{ color: '#C8DEC8' }}>Admin Login</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--adm-text-muted)' }}>Sign in to manage the invitation.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="admin-input"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="admin-input"
          />
          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
          {error && <p className="text-sm" style={{ color: 'var(--adm-danger)' }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
