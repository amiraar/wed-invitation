'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    handler();
    window.addEventListener('scroll', handler);
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
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleNav = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpen(false);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition ${
        scrolled ? 'border-b border-border bg-bg-primary/80 backdrop-blur' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-display text-xl italic">Undangan</span>
        <div className="hidden gap-6 text-sm md:flex">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleNav(section.id)}
              className={`transition ${active === section.id ? 'text-accent' : 'text-text-secondary'}`}
            >
              {section.label}
            </button>
          ))}
        </div>
        <button
          className="md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span className="block h-0.5 w-6 bg-text-primary" />
          <span className="mt-1 block h-0.5 w-6 bg-text-primary" />
        </button>
      </nav>
      {open && (
        <div className="md:hidden">
          <div className="mx-4 mb-4 rounded-2xl border border-border bg-bg-card p-4">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleNav(section.id)}
                className={`block w-full px-2 py-2 text-left text-sm ${
                  active === section.id ? 'text-accent' : 'text-text-secondary'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
