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

    setError(data?.error || 'Login gagal.');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-gray-800">Admin Login</h1>
        <p className="mt-2 text-sm text-gray-500">Masuk untuk mengelola undangan.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Username"
            className="rounded-xl border border-gray-200 px-4 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="rounded-xl border border-gray-200 px-4 py-2"
          />
          <button
            type="submit"
            className="rounded-xl border border-amber-400 bg-amber-400 px-4 py-2 text-sm text-white"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </form>
      </div>
    </div>
  );
}
