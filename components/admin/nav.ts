// Admin navigation, grouped by what the couple is doing. Also used for the header page title.
export const NAV_GROUPS = [
  { label: 'Overview', items: [{ href: '/admin/dashboard', label: 'Dashboard' }] },
  {
    label: 'Guests',
    items: [
      { href: '/admin/guests', label: 'Guest List' },
      { href: '/admin/rsvp', label: 'RSVP Responses' },
      { href: '/admin/guestbook', label: 'Wishes' }
    ]
  },
  {
    label: 'Invitation',
    items: [
      { href: '/admin/wedding', label: 'Couple & Story' },
      { href: '/admin/events', label: 'Events & Venues' },
      { href: '/admin/gallery', label: 'Gallery' },
      { href: '/admin/faqs', label: 'FAQs' }
    ]
  },
  { label: 'Site', items: [{ href: '/admin/settings', label: 'Settings' }] }
] as const;

export function pageTitle(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.label;
    }
  }
  return 'Wedding Invitation';
}
