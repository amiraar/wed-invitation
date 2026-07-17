'use client';

import { useEffect, useState } from 'react';

export type NavSection = { id: string; label: string };

type Props = {
  brand: string;
  sections: NavSection[];
  visible: boolean;
};

export default function Navbar({ brand, sections, visible }: Props) {
  const [active, setActive] = useState(sections[0]?.id ?? 'hero');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
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
  }, [sections]);

  const handleNav = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-4 opacity-0'
      } ${
        scrolled
          ? 'border-b border-[var(--border)] bg-[var(--bg-primary)]/90 shadow-lg shadow-black/20 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <button
          onClick={() => handleNav(sections[0]?.id ?? 'hero')}
          className="font-display text-xl italic text-[var(--text-primary)] transition hover:text-[var(--accent)]"
        >
          {brand}
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
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Buka menu"
          aria-expanded={open}
        >
          <span
            className={`block h-px w-6 bg-[var(--text-primary)] transition-all ${
              open ? 'translate-y-[6.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-6 bg-[var(--text-primary)] transition-all ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-px w-6 bg-[var(--text-primary)] transition-all ${
              open ? '-translate-y-[6.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          open ? 'max-h-[28rem]' : 'max-h-0'
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
