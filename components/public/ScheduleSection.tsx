'use client';

import { motion } from 'framer-motion';
import { fadeUpVariant, staggerContainerVariant } from '@/lib/motion';
import { eventTypeLabel, formatDateID, formatTime } from '@/lib/format';
import SectionHeading from './SectionHeading';
import type { EventItem, ScheduleItem } from '@/lib/types';

type Props = {
  // Already limited to items the visitor may see (general ones + their shown events).
  items: ScheduleItem[];
  events: EventItem[];
};

type Group = { key: string; heading: string; date: string; items: ScheduleItem[] };

function timeLabel(item: ScheduleItem): string {
  if (!item.time_start) return item.time ?? '';
  const start = formatTime(item.time_start);
  return item.time_end ? `${start} – ${formatTime(item.time_end)}` : start;
}

// Items without a start time keep their order and go after the timed ones.
function byStartTime(items: ScheduleItem[]): ScheduleItem[] {
  return [...items].sort((a, b) => (a.time_start || '99:99').localeCompare(b.time_start || '99:99'));
}

// General items first (no heading), then one group per event in date order.
function groupItems(items: ScheduleItem[], events: EventItem[]): Group[] {
  const groups: Group[] = [];
  const general = items.filter((item) => item.event === 'all');
  if (general.length) groups.push({ key: 'all', heading: '', date: '', items: byStartTime(general) });
  const sortedEvents = [...events].sort((a, b) => (a.event_date ?? '9999').localeCompare(b.event_date ?? '9999'));
  for (const event of sortedEvents) {
    const own = items.filter((item) => item.event === event.type);
    if (own.length) {
      groups.push({ key: event.type, heading: eventTypeLabel(event.type), date: formatDateID(event.event_date), items: byStartTime(own) });
    }
  }
  return groups;
}

export default function ScheduleSection({ items, events }: Props) {
  const groups = groupItems(items, events);
  if (groups.length === 0) return null;

  return (
    <section id="schedule" className="section-anchor py-20 md:py-28">
      <div className="mx-auto max-w-xl px-6">
        <motion.div
          variants={staggerContainerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          <SectionHeading align="center" eyebrow="The Day" title="Order of Events" />

          {groups.map((group) => (
            <div key={group.key} className="mt-14" data-testid={`schedule-group-${group.key}`}>
              {group.heading && (
                <motion.div variants={fadeUpVariant} className="mb-8 text-center">
                  <p className="font-display text-2xl italic" style={{ color: 'var(--text-primary)' }}>
                    {group.heading}
                  </p>
                  {group.date && (
                    <p className="mt-1 text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
                      {group.date}
                    </p>
                  )}
                </motion.div>
              )}
              <div className="relative pl-12">
                <div
                  className="absolute bottom-2 top-2 w-px"
                  style={{ left: '19px', background: 'linear-gradient(to bottom, var(--border) 70%, transparent)' }}
                />
                {group.items.map((item, index) => (
                  <motion.div key={index} variants={fadeUpVariant} className="relative mb-11 last:mb-0">
                    <div
                      className="absolute -left-[39px] top-1.5 h-3 w-3 rounded-full"
                      style={{
                        background: 'var(--accent)',
                        border: '2px solid var(--bg-primary)',
                        boxShadow: '0 0 0 3px var(--border)'
                      }}
                    />
                    {timeLabel(item) && (
                      <p className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--accent)' }}>
                        {timeLabel(item)}
                      </p>
                    )}
                    <p className="mt-1 font-display text-xl" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    {item.subtitle && (
                      <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {item.subtitle}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
