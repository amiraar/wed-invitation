'use client';

import { useEffect, useRef, useState } from 'react';

export type NavSection = { id: string; label: string };

type Props = {
  brand: string;
  sections: NavSection[];
};

export default function Navbar({ brand, sections }: Props) {
  const [active, setActive] = useState(sections[0]?.id ?? 'hero');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // The mobile menu closes when tapping outside it or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

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

  // An open mobile menu gets the solid header too, so its links never sit on the hero photo.
  const solid = scrolled || open;
  const linkColor = solid ? 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]' : 'text-hero-text/75 hover:text-[var(--hero-text)]';

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        solid
          ? 'border-b border-[var(--border)] bg-bg-primary/95 shadow-lg shadow-black/5 backdrop-blur-md'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
        <button
          onClick={() => handleNav(sections[0]?.id ?? 'hero')}
          className={`-mx-2 px-2 py-2 font-display text-xl italic transition hover:text-[var(--accent)] ${
            solid ? 'text-[var(--text-primary)]' : 'text-[var(--hero-text)]'
          }`}
        >
          {brand}
        </button>

        <div className="hidden items-center gap-8 md:flex">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNav(section.id)}
              className={`relative text-xs uppercase tracking-[0.25em] transition-colors duration-300 ${
                active === section.id ? 'text-[var(--accent)]' : linkColor
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
          className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <span
            className={`block h-px w-6 transition-all ${solid ? 'bg-[var(--text-primary)]' : 'bg-[var(--hero-text)]'} ${
              open ? 'translate-y-[6.5px] rotate-45' : ''
            }`}
          />
          <span
            className={`block h-px w-6 transition-all ${solid ? 'bg-[var(--text-primary)]' : 'bg-[var(--hero-text)]'} ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-px w-6 transition-all ${solid ? 'bg-[var(--text-primary)]' : 'bg-[var(--hero-text)]'} ${
              open ? '-translate-y-[6.5px] -rotate-45' : ''
            }`}
          />
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          open ? 'max-h-[28rem]' : 'max-h-0'
        }`}
      >
        <div className="space-y-1 border-t border-[var(--border)] bg-bg-primary/95 px-6 py-4 backdrop-blur-md">
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
