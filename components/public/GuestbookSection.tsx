'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { formatDateShortID } from '@/lib/format';
import SectionHeading from './SectionHeading';
import FancyButton from './FancyButton';
import type { GuestbookItem, GuestView } from '@/lib/types';

type Props = {
  messages: GuestbookItem[];
  guest: GuestView | null;
};

// Border color must come from classes, not inline style, or the
// focus: border utility can never override it.
const inputStyle = {
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)'
} as const;

const inputClass =
  'w-full rounded-xl border border-border px-4 py-3.5 text-base sm:text-sm outline-none transition-all duration-300 focus:border-[var(--border-hover)]';

function WishForm({ guest }: { guest: GuestView }) {
  const [text, setText] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setStatus(null);
    if (text.trim().length < 5) {
      setStatus({ type: 'error', text: 'Message must be at least 5 characters.' });
      return;
    }
    setSubmitting(true);
    const response = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: guest.token, message: text, is_anonymous: anonymous })
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSubmitting(false);
    if (data?.success) {
      setStatus({ type: 'success', text: 'Thank you! Your message will appear once approved.' });
      setText('');
    } else {
      setStatus({ type: 'error', text: data?.error || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div>
        <input
          value={anonymous ? 'Someone' : guest.name}
          readOnly
          aria-label="Your name"
          className={`${inputClass} cursor-default opacity-80`}
          style={inputStyle}
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Hide my name (shown as &ldquo;Someone&rdquo;)
        </label>
      </div>
      <div>
        <textarea
          value={text}
          maxLength={1000}
          onChange={(e) => setText(e.target.value)}
          className={`${inputClass} h-32 resize-none`}
          style={inputStyle}
          placeholder="Write your wishes and blessings"
          aria-label="Message"
        />
      </div>
      <FancyButton type="submit" className="w-full py-4" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send Wishes'}
      </FancyButton>
      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Your message will appear publicly on this page once the couple approves it. Links are not allowed. Ask the
        couple anytime if you want it removed.
      </p>
      {status && (
        <p
          role="status"
          className={`text-center text-sm ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}
        >
          {status.text}
        </p>
      )}
    </form>
  );
}

export default function GuestbookSection({ messages, guest }: Props) {
  return (
    <section id="guestbook" className="section-anchor bg-bg-secondary py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="Guestbook"
            title="Wishes & Blessings"
            description="Send your best wishes and blessings to the couple."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-5">
            <motion.div
              variants={fadeUpVariant}
              className="h-fit rounded-3xl p-6 md:col-span-2"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {guest ? (
                <WishForm guest={guest} />
              ) : (
                <p className="text-center text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Wishes can be sent through your personal invitation link. Please open the link the couple sent you.
                </p>
              )}
            </motion.div>

            <motion.div variants={fadeUpVariant} className="md:col-span-3">
              {messages.length === 0 ? (
                <div
                  className="flex h-full min-h-[10rem] items-center justify-center rounded-3xl p-8 text-center text-sm"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                >
                  No messages yet. Be the first to send your wishes!
                </div>
              ) : (
                <div className="max-h-[32rem] space-y-4 overflow-y-auto pr-1">
                  {messages.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl p-5"
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <p
                          className="min-w-0 break-words text-xs font-medium uppercase tracking-[0.25em]"
                          style={{ color: 'var(--accent)' }}
                        >
                          {item.name}
                        </p>
                        <p
                          className="shrink-0 text-[11px]"
                          style={{ color: 'var(--text-muted)' }}
                          suppressHydrationWarning
                        >
                          {formatDateShortID(item.created_at)}
                        </p>
                      </div>
                      <p className="mt-3 break-words text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {item.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
