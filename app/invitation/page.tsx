'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/public/HeroSection';
import EventsSection from '@/components/public/EventsSection';
import GallerySection from '@/components/public/GallerySection';
import RSVPSection from '@/components/public/RSVPSection';
import GuestbookSection from '@/components/public/GuestbookSection';
import EnvelopeSection from '@/components/public/EnvelopeSection';
import MusicPlayer from '@/components/public/MusicPlayer';
import FooterPublic from '@/components/public/FooterPublic';
import type { AppSettings, EventItem, GalleryItem, GuestbookItem, WeddingConfig } from '@/lib/types';

const emptySettings: AppSettings = {
  id: 'main',
  theme: 'dark',
  cover_title: 'Kami Menikah',
  cover_subtitle: 'Buka undangan untuk melihat detail',
  show_lamaran: true,
  show_akad: true,
  show_resepsi: true,
  show_gallery: true,
  show_envelope: true,
  updated_at: ''
};

const emptyWedding: WeddingConfig = {
  id: 'main',
  groom_name: '',
  bride_name: '',
  groom_full_name: '',
  bride_full_name: '',
  groom_parents: '',
  bride_parents: '',
  cover_image_url: '',
  music_url: '',
  music_autoplay: false,
  opening_quote: '',
  updated_at: ''
};

export default function InvitationPage() {
  const [settings, setSettings] = useState<AppSettings>(emptySettings);
  const [wedding, setWedding] = useState<WeddingConfig>(emptyWedding);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [guestbook, setGuestbook] = useState<GuestbookItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [settingsRes, weddingRes, eventsRes, galleryRes, guestbookRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/wedding'),
        fetch('/api/events'),
        fetch('/api/gallery'),
        fetch('/api/guestbook')
      ]);

      const settingsJson = await settingsRes.json().catch(() => null);
      if (settingsJson?.success) setSettings(settingsJson.data);

      const weddingJson = await weddingRes.json().catch(() => null);
      if (weddingJson?.success) setWedding(weddingJson.data);

      const eventsJson = await eventsRes.json().catch(() => null);
      if (eventsJson?.success) setEvents(eventsJson.data);

      const galleryJson = await galleryRes.json().catch(() => null);
      if (galleryJson?.success) setGallery(galleryJson.data);

      const guestbookJson = await guestbookRes.json().catch(() => null);
      if (guestbookJson?.success) setGuestbook(guestbookJson.data);
    };

    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light');
    document.documentElement.classList.toggle('theme-dark', settings.theme !== 'light');
  }, [settings.theme]);

  const filteredEvents = events.filter((event) => {
    if (event.type === 'lamaran') return settings.show_lamaran;
    if (event.type === 'akad') return settings.show_akad;
    if (event.type === 'resepsi') return settings.show_resepsi;
    return true;
  });

  return (
    <main>
      <HeroSection
        groomName={wedding.groom_name}
        brideName={wedding.bride_name}
        openingQuote={wedding.opening_quote}
        coverImageUrl={wedding.cover_image_url}
      />
      <EventsSection events={filteredEvents} />
      {settings.show_gallery && <GallerySection images={gallery} />}
      <RSVPSection events={filteredEvents.map((event) => ({ id: event.id, type: event.type }))} />
      <GuestbookSection messages={guestbook} />
      {settings.show_envelope && <EnvelopeSection accounts={[]} />}
      <FooterPublic />
      {wedding.music_url && <MusicPlayer src={wedding.music_url} autoplay={wedding.music_autoplay} />}
    </main>
  );
}
