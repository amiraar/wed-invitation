'use client';

import { useEffect, useState } from 'react';
import type { FaqItem } from '@/lib/types';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/faqs')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setFaqs(data.data);
      })
      .catch(() => undefined);
  }, []);

  const handleChange = (id: string, key: 'question' | 'answer', value: string) => {
    setFaqs((prev) => prev.map((faq) => (faq.id === id ? { ...faq, [key]: value } : faq)));
  };

  const handleAdd = async () => {
    const response = await fetch('/api/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '', answer: '', order_index: faqs.length })
    });
    const data = await response.json().catch(() => null);
    if (data?.success) setFaqs((prev) => [...prev, data.data]);
  };

  const handleRemove = async (id: string) => {
    await fetch(`/api/faqs/${id}`, { method: 'DELETE' });
    setFaqs((prev) => prev.filter((faq) => faq.id !== id));
  };

  const handleSave = async (faq: FaqItem) => {
    setStatus('Saving...');
    const response = await fetch(`/api/faqs/${faq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: faq.question, answer: faq.answer, order_index: faq.order_index })
    });
    const data = await response.json().catch(() => null);
    setStatus(data?.success ? 'Saved' : data?.error || 'Failed to save');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg italic" style={{ color: '#C8DEC8' }}>FAQs</h2>
          <p className="mt-1 text-xs" style={{ color: 'var(--adm-text-muted)' }}>Common questions guests may have</p>
        </div>
        <button onClick={handleAdd} className="admin-btn-outline">
          + Add FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="admin-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--adm-text-faint)' }}>
                FAQ {index + 1}
              </span>
              <button onClick={() => handleRemove(faq.id)} className="admin-btn-danger">
                ✕ Remove
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="admin-label">Question</label>
                <input
                  value={faq.question}
                  onChange={(event) => handleChange(faq.id, 'question', event.target.value)}
                  placeholder="When should I arrive?"
                  className="admin-input w-full"
                />
              </div>
              <div>
                <label className="admin-label">Answer</label>
                <textarea
                  value={faq.answer}
                  onChange={(event) => handleChange(faq.id, 'answer', event.target.value)}
                  placeholder="We recommend arriving..."
                  className="admin-input h-20 w-full"
                />
              </div>
              <button onClick={() => handleSave(faq)} className="admin-btn-primary">
                Save
              </button>
            </div>
          </div>
        ))}

        {faqs.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm" style={{ borderColor: 'var(--adm-border-strong)', color: 'var(--adm-text-muted)' }}>
            No FAQs yet. Add one to get started.
          </p>
        )}
      </div>

      {status && <p className="text-sm" style={{ color: 'var(--adm-text-muted)' }}>{status}</p>}
    </div>
  );
}
