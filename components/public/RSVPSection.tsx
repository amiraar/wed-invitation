'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { eventTypeLabel } from '@/lib/format';
import SectionHeading from './SectionHeading';
import FancyButton from './FancyButton';
import type { EventItem, EventType, GuestView } from '@/lib/types';

type Props = {
  // Only active events this guest is invited to.
  events: Pick<EventItem, 'id' | 'type'>[];
  guest: GuestView | null;
};

// Border color must come from classes, not inline style, or the
// focus:/hover: border utilities can never override it.
const inputStyle = {
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)'
} as const;

const inputClass =
  'w-full rounded-xl border border-border px-4 py-3.5 text-base sm:text-sm outline-none transition-all duration-300 focus:border-[var(--border-hover)]';

const optionClass =
  'flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3.5 text-sm transition-colors duration-300 hover:border-[var(--border-hover)]';

function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-[11px] uppercase tracking-[0.25em]"
      style={{ color: 'var(--text-muted)' }}
    >
      {children}
    </label>
  );
}

// Success is a soft highlighted card right under the button, so it is seen on phones too.
export function StatusMessage({ status }: { status: { type: 'success' | 'error'; text: string } }) {
  return (
    <p
      role="status"
      className="rounded-2xl px-4 py-3 text-center text-sm"
      style={
        status.type === 'success'
          ? { background: 'var(--accent-dim)', border: '1px solid var(--border-hover)', color: 'var(--accent)' }
          : { background: 'rgba(220, 80, 80, 0.08)', border: '1px solid rgba(220, 80, 80, 0.35)', color: '#c24848' }
      }
    >
      {status.type === 'success' ? '♥ ' : ''}
      {status.text}
    </p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={fadeUpVariant}
      className="mt-10 rounded-3xl p-6 sm:p-8"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}
    >
      {children}
    </motion.div>
  );
}

function RSVPForm({ guest, events }: { guest: GuestView; events: Props['events'] }) {
  const previous = guest.rsvp;
  const [attending, setAttending] = useState(previous ? previous.attending : true);
  const [selected, setSelected] = useState<Record<EventType, boolean>>(() =>
    previous?.attending
      ? { lamaran: previous.lamaran, akad: previous.akad, resepsi: previous.resepsi }
      : { lamaran: true, akad: true, resepsi: true }
  );
  const [guestCount, setGuestCount] = useState(Math.min(Math.max(previous?.guestCount ?? 1, 1), guest.maxGuests));
  const [note, setNote] = useState(previous?.message ?? '');
  const [hasRsvp, setHasRsvp] = useState(Boolean(previous));
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isChosen = (type: EventType) => (events.length === 1 ? true : selected[type]);

  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);
    const response = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: guest.token,
        attending,
        guest_count: guestCount,
        attending_lamaran: attending && events.some((e) => e.type === 'lamaran') && isChosen('lamaran'),
        attending_akad: attending && events.some((e) => e.type === 'akad') && isChosen('akad'),
        attending_resepsi: attending && events.some((e) => e.type === 'resepsi') && isChosen('resepsi'),
        message: note
      })
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSubmitting(false);
    if (data?.success) {
      setHasRsvp(true);
      setStatus({
        type: 'success',
        text: attending
          ? 'Thank you! Your RSVP has been received. You can update it anytime.'
          : 'Thank you for letting us know. You can update your RSVP anytime.'
      });
    } else {
      setStatus({ type: 'error', text: data?.error || 'Something went wrong. Please try again.' });
    }
  };

  return (
    <form className="grid gap-5" onSubmit={onSubmit}>
      <div className="text-center">
        <p className="font-display text-2xl italic" style={{ color: 'var(--text-primary)' }}>
          Dear {guest.name}
        </p>
        {guest.maxGuests > 1 && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            This invitation is for up to {guest.maxGuests} people.
          </p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 block text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
          Will You Attend
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { value: true, label: 'Joyfully accept' },
            { value: false, label: 'Regretfully decline' }
          ].map((option) => (
            <label key={option.label} className={optionClass} style={inputStyle}>
              <input
                type="radio"
                name="rsvp-attending"
                className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                checked={attending === option.value}
                onChange={() => setAttending(option.value)}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {attending && events.length > 1 && (
        <fieldset>
          <legend className="mb-2 block text-[11px] uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
            Which Events
          </legend>
          <div className="grid gap-2">
            {events.map((item) => (
              <label key={item.id} className={optionClass} style={inputStyle}>
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-[var(--accent)]"
                  checked={selected[item.type]}
                  onChange={(e) => setSelected((prev) => ({ ...prev, [item.type]: e.target.checked }))}
                />
                <span style={{ color: 'var(--text-secondary)' }}>{eventTypeLabel(item.type)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {attending && guest.maxGuests > 1 && (
        <div>
          <FieldLabel htmlFor="rsvp-guests">Number of Guests</FieldLabel>
          <input
            id="rsvp-guests"
            type="number"
            min={1}
            max={guest.maxGuests}
            value={guestCount}
            onChange={(e) => setGuestCount(Math.min(Math.max(Number(e.target.value) || 1, 1), guest.maxGuests))}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      )}

      <div>
        <FieldLabel htmlFor="rsvp-message">A Note for the Couple (Optional)</FieldLabel>
        <textarea
          id="rsvp-message"
          value={note}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          className={`${inputClass} h-28 resize-none`}
          style={inputStyle}
          placeholder="Your wishes and message..."
        />
      </div>

      <FancyButton type="submit" className="w-full py-4" disabled={submitting}>
        {submitting ? 'Sending...' : hasRsvp ? 'Update RSVP' : 'Send RSVP'}
      </FancyButton>

      {status && <StatusMessage status={status} />}

      <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        Your RSVP is only visible to the couple and is used to plan the celebration. Ask the couple anytime if you
        want it removed.
      </p>
    </form>
  );
}

export default function RSVPSection({ events, guest }: Props) {
  return (
    <section id="rsvp" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-2xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading
            align="center"
            eyebrow="Join Us"
            title="RSVP"
            description="Kindly confirm your attendance to help us prepare for the celebration."
          />

          <Card>
            {guest && events.length > 0 ? (
              <RSVPForm guest={guest} events={events} />
            ) : (
              <p className="text-center text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {guest
                  ? 'Event details will be announced soon. Please check back later to confirm your attendance.'
                  : 'RSVP is available through your personal invitation link. Please open the link the couple sent you to confirm your attendance.'}
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
