'use client';

import { useEffect, useState } from 'react';
import RSVPTable from '@/components/admin/RSVPTable';
import { useToast } from '@/components/admin/ToastProvider';
import type { RSVPItem } from '@/lib/types';

export default function RSVPPage() {
  const toast = useToast();
  const [rows, setRows] = useState<RSVPItem[]>([]);

  useEffect(() => {
    fetch('/api/rsvp')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setRows(data.data);
      })
      .catch(() => toast('Could not load RSVPs. Please refresh the page.', 'error'));
  }, [toast]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this RSVP permanently?')) return;
    const response = await fetch(`/api/rsvp/${id}`, { method: 'DELETE' }).catch(() => null);
    if (!response?.ok) {
      toast('Failed to delete the RSVP.', 'error');
      return;
    }
    setRows((prev) => prev.filter((item) => item.id !== id));
    toast('RSVP deleted.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>RSVP List</h2>
        <a href="/api/rsvp/export" className="admin-btn-primary">
          Export CSV
        </a>
      </div>
      <RSVPTable rows={rows} onDelete={handleDelete} />
    </div>
  );
}
