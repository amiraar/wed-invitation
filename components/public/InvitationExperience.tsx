'use client';

import { useEffect, useRef } from 'react';
import { MotionConfig } from 'framer-motion';
import Navbar, { type NavSection } from './Navbar';
import HeroSection from './HeroSection';
import StorySection from './StorySection';
import CoupleSection from './CoupleSection';
import EventsSection from './EventsSection';
import VenueSection from './VenueSection';
import DressCodeSection from './DressCodeSection';
import GallerySection from './GallerySection';
import RegistrySection from './RegistrySection';
import RSVPSection from './RSVPSection';
import FAQSection from './FAQSection';
import GuestbookSection from './GuestbookSection';
import FooterPublic from './FooterPublic';
import MusicPlayer, { type MusicPlayerHandle } from './MusicPlayer';
import { formatDateID } from '@/lib/format';
import type { InvitationData } from '@/lib/queries';

type Props = {
  data: InvitationData;
};

export default function InvitationExperience({ data }: Props) {
  const { settings, wedding, events, gallery, guestbook, faqs } = data;
  const musicRef = useRef<MusicPlayerHandle>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light');
    document.documentElement.classList.toggle('theme-dark', settings.theme !== 'light');
  }, [settings.theme]);

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
  const showRegistry = settings.show_envelope && (wedding.bank_accounts.length > 0 || wedding.wishlist_note);
  const hasStory = Boolean(wedding.opening_quote || wedding.story_body);
  const hasVenue = Boolean(mainEvent?.venue_name || mainEvent?.address);
  const hasDressCode = Boolean(
    wedding.dress_code_title || wedding.dress_code_note || wedding.dress_code_swatches.length > 0
  );
  const hasFaqs = faqs.length > 0;

  const navSections: NavSection[] = [
    { id: 'hero', label: 'Home' },
    ...(hasStory ? [{ id: 'story', label: 'Story' }] : []),
    ...(activeEvents.length > 0 ? [{ id: 'schedule', label: 'Schedule' }] : []),
    ...(hasVenue ? [{ id: 'venue', label: 'Venue' }] : []),
    ...(showGallery ? [{ id: 'gallery', label: 'Gallery' }] : []),
    { id: 'rsvp', label: 'RSVP' },
    ...(hasFaqs ? [{ id: 'faq', label: 'FAQ' }] : [])
  ];

  const brand =
    wedding.groom_name && wedding.bride_name
      ? `${wedding.groom_name[0]} & ${wedding.bride_name[0]}`
      : 'Invitation';

  const hasMusic = Boolean(wedding.music_url);

  useEffect(() => {
    if (hasMusic && wedding.music_autoplay) {
      musicRef.current?.play();
    }
  }, [hasMusic, wedding.music_autoplay]);

  return (
    <MotionConfig reducedMotion="user">
      <Navbar brand={brand} sections={navSections} />

      <main>
        <HeroSection
          groomName={wedding.groom_name}
          brideName={wedding.bride_name}
          coverImageUrl={wedding.cover_image_url}
          dateLabel={mainEvent ? formatDateID(mainEvent.event_date) : ''}
          venueLine={mainEvent?.venue_name ?? ''}
        />
        {hasStory && <StorySection quote={wedding.opening_quote} body={wedding.story_body} />}
        {hasCouple && <CoupleSection wedding={wedding} />}
        {activeEvents.length > 0 && <EventsSection events={activeEvents} />}
        {hasVenue && mainEvent && <VenueSection event={mainEvent} imageUrl={wedding.venue_image_url} />}
        {hasDressCode && (
          <DressCodeSection
            title={wedding.dress_code_title}
            note={wedding.dress_code_note}
            avoidNote={wedding.dress_code_avoid_note}
            swatches={wedding.dress_code_swatches}
          />
        )}
        {showGallery && <GallerySection images={gallery} />}
        {showRegistry && (
          <RegistrySection
            accounts={wedding.bank_accounts}
            wishlistTitle={wedding.wishlist_title}
            wishlistNote={wedding.wishlist_note}
          />
        )}
        <RSVPSection events={activeEvents.map((event) => ({ id: event.id, type: event.type }))} />
        {hasFaqs && <FAQSection faqs={faqs} />}
        <GuestbookSection messages={guestbook} />
        <FooterPublic groomName={wedding.groom_name} brideName={wedding.bride_name} />
      </main>

      {hasMusic && <MusicPlayer ref={musicRef} src={wedding.music_url} />}
    </MotionConfig>
  );
}
