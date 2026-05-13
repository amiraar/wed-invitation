'use client';

import { useEffect, useState } from 'react';
import GuestbookTable from '@/components/admin/GuestbookTable';
import type { GuestbookItem } from '@/lib/types';

export default function GuestbookPage() {
  const [rows, setRows] = useState<GuestbookItem[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetch('/api/guestbook')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setRows(data.data);
      })
      .catch(() => undefined);
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    await fetch(`/api/guestbook/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });

    setRows((prev) =>
      prev.map((item) => (item.id === id ? { ...item, is_approved: action === 'approve' } : item))
    );
  };

  const filtered = rows.filter((item) => {
    if (tab === 'pending') return !item.is_approved;
    if (tab === 'approved') return item.is_approved;
    return false;
  });

  const handleBulkApprove = async () => {
    const pending = rows.filter((item) => !item.is_approved);
    await Promise.all(
      pending.map((item) =>
        fetch(`/api/guestbook/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' })
        })
      )
    );

    setRows((prev) => prev.map((item) => ({ ...item, is_approved: true })));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] ${
              tab === item ? 'border-amber-400 bg-amber-100 text-amber-700' : 'border-gray-200'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === 'pending' && (
        <button
          onClick={handleBulkApprove}
          className="w-fit rounded-full border border-amber-400 bg-amber-400 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white"
        >
          Approve Semua Pending
        </button>
      )}
      <GuestbookTable rows={filtered} onAction={handleAction} />
    </div>
  );
}
