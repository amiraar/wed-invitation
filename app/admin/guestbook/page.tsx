'use client';

import { useEffect, useState } from 'react';
import GuestbookTable from '@/components/admin/GuestbookTable';
import { useToast } from '@/components/admin/ToastProvider';
import type { GuestbookItem } from '@/lib/types';

type Tab = 'pending' | 'approved' | 'all';
const TAB_LABELS: Record<Tab, string> = { pending: 'Pending', approved: 'Approved', all: 'All' };

export default function GuestbookPage() {
  const toast = useToast();
  const [rows, setRows] = useState<GuestbookItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');

  useEffect(() => {
    fetch('/api/guestbook')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setRows(data.data);
        setLoaded(true);
      })
      .catch(() => toast('Could not load wishes. Please refresh the page.', 'error'));
  }, [toast]);

  const setApproval = (id: string, action: 'approve' | 'reject') =>
    fetch(`/api/guestbook/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    })
      .then((res) => res.ok)
      .catch(() => false);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const ok = await setApproval(id, action);
    if (!ok) {
      toast('Failed to update the wish.', 'error');
      return;
    }
    setRows((prev) => prev.map((item) => (item.id === id ? { ...item, is_approved: action === 'approve' } : item)));
    toast(action === 'approve' ? 'Wish approved — it is now on the invitation.' : 'Wish hidden from the invitation.');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this message permanently?')) return;
    const response = await fetch(`/api/guestbook/${id}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      toast('Failed to delete the wish.', 'error');
      return;
    }
    setRows((prev) => prev.filter((item) => item.id !== id));
    toast('Wish deleted.');
  };

  const handleBulkApprove = async () => {
    const pending = rows.filter((item) => !item.is_approved);
    const results = await Promise.all(pending.map((item) => setApproval(item.id, 'approve').then((ok) => ({ id: item.id, ok }))));
    const approved = new Set(results.filter((r) => r.ok).map((r) => r.id));
    setRows((prev) => prev.map((item) => (approved.has(item.id) ? { ...item, is_approved: true } : item)));
    const failed = results.length - approved.size;
    toast(
      failed ? `${approved.size} approved, ${failed} failed. Please try again.` : `${approved.size} wishes approved.`,
      failed ? 'error' : 'success'
    );
  };

  const counts: Record<Tab, number> = {
    pending: rows.filter((item) => !item.is_approved).length,
    approved: rows.filter((item) => item.is_approved).length,
    all: rows.length
  };
  const filtered = rows.filter((item) => (tab === 'all' ? true : tab === 'approved' ? item.is_approved : !item.is_approved));

  return (
    <div className="space-y-6">
      <p className="text-xs" style={{ color: 'var(--adm-text-muted)' }}>
        Wishes appear on the invitation only after you approve them. Links and rude words are already blocked.
      </p>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Wishes">
        {(Object.keys(TAB_LABELS) as Tab[]).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            onClick={() => setTab(item)}
            className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition-all"
            style={
              tab === item
                ? { border: '1px solid var(--adm-accent)', background: 'rgba(122,158,122,0.15)', color: '#C8DEC8' }
                : { border: '1px solid var(--adm-border)', color: 'var(--adm-text-muted)' }
            }
          >
            {TAB_LABELS[item]} ({counts[item]})
          </button>
        ))}
      </div>
      {tab === 'pending' && counts.pending > 0 && (
        <button onClick={handleBulkApprove} className="admin-btn-primary w-fit">
          Approve All Pending
        </button>
      )}
      {loaded && filtered.length === 0 ? (
        <p className="admin-card p-6 text-center text-sm" style={{ color: 'var(--adm-text-muted)' }}>
          {tab === 'pending' ? 'No wishes waiting for approval.' : 'No wishes here yet.'}
        </p>
      ) : (
        <GuestbookTable rows={filtered} onAction={handleAction} onDelete={handleDelete} />
      )}
    </div>
  );
}
