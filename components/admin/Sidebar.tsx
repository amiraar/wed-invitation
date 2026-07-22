'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/wedding', label: 'Wedding' },
  { href: '/admin/events', label: 'Schedule' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/faqs', label: 'FAQs' },
  { href: '/admin/rsvp', label: 'RSVP' },
  { href: '/admin/guestbook', label: 'Guestbook' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden w-60 flex-shrink-0 p-5 md:block"
      style={{ background: 'var(--adm-bg-topbar)', borderRight: '1px solid var(--adm-border)' }}
    >
      <div className="font-display text-xl italic" style={{ color: '#C8DEC8' }}>
        Wedding CMS
      </div>
      <nav className="mt-6 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 text-xs uppercase tracking-[0.15em] transition-all"
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
      </nav>
    </aside>
  );
}
