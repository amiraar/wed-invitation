'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import CoverOverlay from './CoverOverlay';
import Navbar, { type NavSection } from './Navbar';
import HeroSection from './HeroSection';
import CoupleSection from './CoupleSection';
import EventsSection from './EventsSection';
import GallerySection from './GallerySection';
import RSVPSection from './RSVPSection';
import GuestbookSection from './GuestbookSection';
import EnvelopeSection from './EnvelopeSection';
import FooterPublic from './FooterPublic';
import MusicPlayer, { type MusicPlayerHandle } from './MusicPlayer';
import { formatDateID } from '@/lib/format';
import type { InvitationData } from '@/lib/queries';

type Props = {
  data: InvitationData;
  guestName: string;
};

export default function InvitationExperience({ data, guestName }: Props) {
  const { settings, wedding, events, gallery, guestbook } = data;
  const [opened, setOpened] = useState(false);
  const musicRef = useRef<MusicPlayerHandle>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light');
    document.documentElement.classList.toggle('theme-dark', settings.theme !== 'light');
  }, [settings.theme]);

  // No scrolling while the cover is shown.
  useEffect(() => {
    document.body.style.overflow = opened ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [opened]);

  const activeEvents = events.filter((event) => {
    if (!event.is_active) return false;
    if (event.type === 'lamaran') return settings.show_lamaran;
    if (event.type === 'akad') return settings.show_akad;
    if (event.type === 'resepsi') return settings.show_resepsi;
    return true;
  });

  const mainEvent =
    activeEvents.find((event) => event.type === 'akad') ??
    activeEvents.find((event) => event.type === 'resepsi') ??
    activeEvents[0];

  const hasCouple = Boolean(wedding.groom_name || wedding.bride_name);
  const showGallery = settings.show_gallery && gallery.length > 0;
  const showEnvelope = settings.show_envelope && wedding.bank_accounts.length > 0;

  const navSections: NavSection[] = [
    { id: 'hero', label: 'Beranda' },
    ...(hasCouple ? [{ id: 'couple', label: 'Mempelai' }] : []),
    ...(activeEvents.length > 0 ? [{ id: 'events', label: 'Acara' }] : []),
    ...(showGallery ? [{ id: 'gallery', label: 'Galeri' }] : []),
    { id: 'rsvp', label: 'RSVP' },
    { id: 'guestbook', label: 'Ucapan' },
    ...(showEnvelope ? [{ id: 'envelope', label: 'Amplop' }] : [])
  ];

  const brand =
    wedding.groom_name && wedding.bride_name
      ? `${wedding.groom_name} & ${wedding.bride_name}`
      : 'Undangan';

  const hasMusic = Boolean(wedding.music_url);

  // Playback starts inside the tap handler so mobile browsers allow it.
  const handleOpen = () => {
    setOpened(true);
    if (hasMusic && wedding.music_autoplay) {
      musicRef.current?.play();
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {!opened && (
          <CoverOverlay
            key="cover"
            coverTitle={settings.cover_title}
            coverSubtitle={settings.cover_subtitle}
            groomName={wedding.groom_name}
            brideName={wedding.bride_name}
            guestName={guestName}
            showMusicHint={hasMusic && wedding.music_autoplay}
            onOpen={handleOpen}
          />
        )}
      </AnimatePresence>

      <Navbar brand={brand} sections={navSections} visible={opened} />

      <main>
        <HeroSection
          groomName={wedding.groom_name}
          brideName={wedding.bride_name}
          openingQuote={wedding.opening_quote}
          coverImageUrl={wedding.cover_image_url}
          dateLabel={mainEvent ? formatDateID(mainEvent.event_date) : ''}
          started={opened}
        />
        {hasCouple && <CoupleSection wedding={wedding} />}
        {activeEvents.length > 0 && <EventsSection events={activeEvents} />}
        {showGallery && <GallerySection images={gallery} />}
        <RSVPSection events={activeEvents.map((event) => ({ id: event.id, type: event.type }))} />
        <GuestbookSection messages={guestbook} />
        {showEnvelope && <EnvelopeSection accounts={wedding.bank_accounts} />}
        <FooterPublic groomName={wedding.groom_name} brideName={wedding.bride_name} />
      </main>

      {hasMusic && <MusicPlayer ref={musicRef} src={wedding.music_url} />}
    </MotionConfig>
  );
}
