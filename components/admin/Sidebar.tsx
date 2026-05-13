'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/wedding', label: 'Wedding' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/gallery', label: 'Gallery' },
  { href: '/admin/rsvp', label: 'RSVP' },
  { href: '/admin/guestbook', label: 'Guestbook' },
  { href: '/admin/settings', label: 'Settings' }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 border-r border-gray-200 bg-white p-6 md:block">
      <div className="text-lg font-semibold">Admin Panel</div>
      <nav className="mt-6 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-3 py-2 text-sm ${
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)) ? 'bg-amber-100 text-amber-700' : 'text-gray-600'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
