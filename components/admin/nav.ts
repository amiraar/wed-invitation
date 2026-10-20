// Numbers shown as badges next to a menu item (from GET /api/admin/counts).
export type BadgeKey = 'pendingWishes' | 'guestsNoReply';
export const BADGE_TEXT: Record<BadgeKey, string> = {
  pendingWishes: 'waiting for approval',
  guestsNoReply: 'guests without a reply yet'
};

type NavItem = { href: string; label: string; badge?: BadgeKey };

// Admin navigation, grouped by what the couple is doing. Also used for the header page title.
export const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  { label: 'Overview', items: [{ href: '/admin/dashboard', label: 'Dashboard' }] },
  {
    label: 'Guests',
    items: [
      { href: '/admin/guests', label: 'Guest List', badge: 'guestsNoReply' },
      { href: '/admin/rsvp', label: 'RSVP Responses' },
      { href: '/admin/guestbook', label: 'Wishes', badge: 'pendingWishes' }
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
];

// Pages that change these numbers dispatch this event so the badges refresh right away.
export const COUNTS_EVENT = 'admin:counts-changed';
export function refreshAdminCounts(): void {
  window.dispatchEvent(new Event(COUNTS_EVENT));
}

export function pageTitle(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return item.label;
    }
  }
  return 'Wedding Invitation';
}
