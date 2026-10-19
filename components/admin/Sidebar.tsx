'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavIcon from './NavIcon';
import { BADGE_TEXT, COUNTS_EVENT, NAV_GROUPS, type BadgeKey } from './nav';

type Counts = Record<BadgeKey, number>;

// Desktop: sticky, full screen height, scrolls on its own if the menu is taller than the screen.
// Below lg: a slide-in drawer opened from the header menu button.
export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts | null>(null);

  const loadCounts = useCallback(() => {
    fetch('/api/admin/counts')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) setCounts(data.data);
      })
      .catch(() => undefined);
  }, []);

  // Refresh on every page change and whenever a page reports a change (approve, RSVP delete, ...).
  useEffect(() => loadCounts(), [pathname, loadCounts]);
  useEffect(() => {
    window.addEventListener(COUNTS_EVENT, loadCounts);
    return () => window.removeEventListener(COUNTS_EVENT, loadCounts);
  }, [loadCounts]);

  return (
    <>
      {/* Tap target only; keyboard and screen-reader users close with ✕ or Escape. */}
      {open && <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-black/50 lg:hidden" />}
      <aside
        id="admin-nav"
        aria-label="Admin menu"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-shrink-0 flex-col overflow-y-auto overscroll-contain transition-[transform,visibility] duration-200 lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-64 lg:max-w-none lg:translate-x-0 ${
          open ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
        style={{
          background: 'var(--adm-bg-topbar)',
          borderRight: '1px solid var(--adm-border)',
          paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <div className="font-display text-xl italic" style={{ color: '#C8DEC8' }}>
            Wedding CMS
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg lg:hidden"
            style={{ border: '1px solid var(--adm-border)', color: 'var(--adm-text)' }}
          >
            <span aria-hidden="true" className="text-lg leading-none">✕</span>
          </button>
        </div>

        <nav className="mt-6 space-y-6 px-3" aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--adm-text-faint)' }}>
                {group.label}
              </p>
              <div className="mt-2 space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const count = item.badge && counts ? counts[item.badge] : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className="flex min-h-[44px] items-center gap-3 rounded-r-lg px-3 py-2 text-sm transition-all"
                      style={{
                        color: active ? '#C8DEC8' : 'var(--adm-text-muted)',
                        background: active ? 'rgba(120,160,120,0.1)' : 'transparent',
                        borderLeft: active ? '2px solid var(--adm-accent)' : '2px solid transparent'
                      }}
                    >
                      <NavIcon href={item.href} />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {count > 0 && item.badge && (
                        <span
                          data-testid={`badge-${item.badge}`}
                          title={`${count} ${BADGE_TEXT[item.badge]}`}
                          className="min-w-[1.5rem] shrink-0 rounded-full px-2 py-0.5 text-center text-[11px] font-medium leading-4"
                          style={{ background: 'var(--adm-accent)', color: '#0f1a0f' }}
                        >
                          <span aria-hidden="true">{count > 99 ? '99+' : count}</span>
                          <span className="sr-only">
                            ({count} {BADGE_TEXT[item.badge]})
                          </span>
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
