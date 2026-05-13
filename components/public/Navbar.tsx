'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const sections = [
  { id: 'hero', label: 'Beranda' },
  { id: 'events', label: 'Acara' },
  { id: 'gallery', label: 'Galeri' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'guestbook', label: 'Ucapan' },
  { id: 'envelope', label: 'Amplop' }
];

export default function Navbar() {
  const [active, setActive] = useState('hero');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    handler();
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    if (pathname !== '/invitation') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/invitation') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [pathname]);

  const handleNav = (id: string) => {
    setOpen(false);
    if (pathname === '/invitation') {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      router.push(`/invitation#${id}`);
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-md shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <button
          onClick={() => handleNav('hero')}
          className="font-display text-xl italic text-[var(--text-primary)] transition hover:text-[var(--accent)]"
        >
          Undangan
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNav(section.id)}
              className={`relative text-xs uppercase tracking-[0.25em] transition-colors duration-300 ${
                active === section.id
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {section.label}
              {active === section.id && (
                <span className="absolute -bottom-1 left-0 h-px w-full bg-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>

        <button
          className="flex flex-col gap-1.5 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-px w-6 bg-[var(--text-primary)] transition-all ${
              open ? 'translate-y-2.5 rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-6 bg-[var(--text-primary)] transition-all ${
              open ? 'opacity-0' : ''
            }`}
          />
          <span
            className={`block h-px w-6 bg-[var(--text-primary)] transition-all ${
              open ? '-translate-y-2.5 -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="space-y-1 border-t border-[var(--border)] bg-[var(--bg-primary)]/95 px-6 py-4 backdrop-blur-md">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNav(section.id)}
              className={`block w-full px-3 py-3 text-left text-xs uppercase tracking-[0.25em] transition-colors ${
                active === section.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
