// Small line icons for the admin menu (inline SVG, follows the link color).
const PATHS: Record<string, string[]> = {
  '/admin/dashboard': ['M4 4h7v7H4z', 'M13 4h7v4h-7z', 'M13 10h7v10h-7z', 'M4 13h7v7H4z'],
  '/admin/guests': [
    'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
    'M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5',
    'M16 4.4a3.5 3.5 0 0 1 0 6.2',
    'M18 14.8c1.9.8 3.1 2.6 3.5 5.2'
  ],
  '/admin/rsvp': ['M8 4h8v3H8z', 'M6 5.5H4.5V21h15V5.5H18', 'M8.5 14l2.5 2.5 4.5-5'],
  '/admin/guestbook': ['M4 5h16v11H9l-5 4z', 'M8 9.5h8', 'M8 12.5h5'],
  '/admin/wedding': ['M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z'],
  '/admin/events': ['M4 6h16v14H4z', 'M4 10h16', 'M8.5 3.5v4', 'M15.5 3.5v4', 'M8 14h3v3H8z'],
  '/admin/gallery': ['M4 5h16v14H4z', 'M4 16l5-5 4 4 3-3 4 4', 'M15.5 9a1.5 1.5 0 1 0 0-.01'],
  '/admin/faqs': ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6', 'M12 17h.01'],
  '/admin/settings': [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    'M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z'
  ]
};

export default function NavIcon({ href }: { href: string }) {
  const paths = PATHS[href];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
