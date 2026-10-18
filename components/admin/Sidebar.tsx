'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_GROUPS } from './nav';

// Fixed on large screens; a slide-in drawer below lg, opened from the header menu button.
export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}
      <aside
        id="admin-nav"
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 overflow-y-auto p-5 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--adm-bg-topbar)', borderRight: '1px solid var(--adm-border)' }}
      >
        <div className="font-display text-xl italic" style={{ color: '#C8DEC8' }}>
          Wedding CMS
        </div>
        <nav className="mt-6 space-y-6" aria-label="Admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 text-[10px] uppercase tracking-[0.25em]" style={{ color: 'var(--adm-text-faint)' }}>
                {group.label}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className="block px-3 py-2.5 text-sm transition-all"
                      style={{
                        color: active ? '#C8DEC8' : 'var(--adm-text-muted)',
                        background: active ? 'rgba(120,160,120,0.1)' : 'transparent',
                        borderLeft: active ? '2px solid var(--adm-accent)' : '2px solid transparent'
                      }}
                    >
                      {item.label}
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
