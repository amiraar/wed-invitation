'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar, { type NavSection } from './Navbar';
import CoverOverlay from './CoverOverlay';
import HeroSection from './HeroSection';
import CountdownSection from './CountdownSection';
import StorySection from './StorySection';
import CoupleSection from './CoupleSection';
import ScheduleSection from './ScheduleSection';
import EventsSection from './EventsSection';
import DressCodeSection from './DressCodeSection';
import GallerySection from './GallerySection';
import RegistrySection from './RegistrySection';
import RSVPSection from './RSVPSection';
import FAQSection from './FAQSection';
import GuestbookSection from './GuestbookSection';
import FooterPublic from './FooterPublic';
import MusicPlayer, { type MusicPlayerHandle } from './MusicPlayer';
import { eventTargetDate, formatDateID } from '@/lib/format';
import type { InvitationData } from '@/lib/queries';
import type { GalleryPosition, GuestView } from '@/lib/types';

type Props = {
  data: InvitationData;
  // Set on a personal link (/to/{name}/{token}); null on the public page.
  guest: GuestView | null;
};

export default function InvitationExperience({ data, guest }: Props) {
  const { settings, wedding, events, gallery, guestbook, faqs } = data;
  const musicRef = useRef<MusicPlayerHandle>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', settings.theme === 'light');
    document.documentElement.classList.toggle('theme-dark', settings.theme !== 'light');
  }, [settings.theme]);

  // The page behind the cover doesn't scroll until the invitation is opened.
  useEffect(() => {
    document.body.style.overflow = opened ? '' : 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [opened]);

  // Shown events are set per event in admin (is_active); a personal link also limits them to the
  // events the guest is invited to.
  const activeEvents = events.filter((event) => event.is_active && (!guest || guest.invited[event.type]));
  const eventsWithDetails = activeEvents.filter((event) => event.event_date || event.venue_name || event.address);

  const mainEvent =
    activeEvents.find((event) => event.type === 'akad') ??
    activeEvents.find((event) => event.type === 'resepsi') ??
    activeEvents[0];

  const hasCouple = Boolean(wedding.groom_name || wedding.bride_name);
  const showGallery = settings.show_gallery && gallery.length > 0;
  const showRegistry = settings.show_envelope && (wedding.bank_accounts.length > 0 || wedding.wishlist_note);
  const hasStory = Boolean(wedding.opening_quote || wedding.story_body);
  // Rundown items follow their event: hidden when the event is off or the guest isn't invited to it.
  const shownEventTypes = new Set(activeEvents.map((event) => event.type));
  const scheduleItems = wedding.schedule_items.filter((item) => item.event === 'all' || shownEventTypes.has(item.event));
  const hasSchedule = scheduleItems.length > 0;
  const hasEvents = eventsWithDetails.length > 0;
  const hasDressCode = Boolean(
    wedding.dress_code_title || wedding.dress_code_note || wedding.dress_code_swatches.length > 0
  );
  const hasFaqs = faqs.length > 0;
  const mainEventTarget = mainEvent ? eventTargetDate(mainEvent) : null;
  const dateLabel = mainEvent ? formatDateID(mainEvent.event_date) : '';

  // Where the couple placed the gallery (Gallery page); the menu follows the page order.
  // Fallbacks cover a database that hasn't run the gallery-options migration yet.
  const galleryAt = (position: GalleryPosition) => showGallery && (settings.gallery_position ?? 'after_events') === position;
  const galleryNav = [{ id: 'gallery', label: 'Gallery' }];
  const navSections: NavSection[] = [
    { id: 'hero', label: 'Home' },
    ...(hasStory ? [{ id: 'story', label: 'Story' }] : []),
    ...(galleryAt('after_story') ? galleryNav : []),
    ...(hasEvents ? [{ id: 'events', label: 'Events' }] : []),
    ...(hasSchedule ? [{ id: 'schedule', label: 'Schedule' }] : []),
    ...(galleryAt('after_events') || galleryAt('before_rsvp') ? galleryNav : []),
    { id: 'rsvp', label: 'RSVP' },
    ...(hasFaqs ? [{ id: 'faq', label: 'FAQ' }] : [])
  ];
  const gallerySection = <GallerySection images={gallery} layout={settings.gallery_layout ?? 'masonry'} />;

  const brand =
    wedding.groom_name && wedding.bride_name
      ? `${wedding.groom_name[0]} & ${wedding.bride_name[0]}`
      : 'Invitation';

  const hasMusic = Boolean(wedding.music_url);

  // Opening is a user gesture, so the browser allows the music to start here.
  const handleOpen = () => {
    setOpened(true);
    if (hasMusic && wedding.music_autoplay) musicRef.current?.play();
  };

  // The theme class is rendered on the server too, so a dark invitation never flashes light first.
  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark';

  return (
    <MotionConfig reducedMotion="user">
      <div className={`${themeClass} min-h-dvh bg-bg-primary text-text-primary`} data-theme={settings.theme}>
        <AnimatePresence>
          {!opened && (
            <CoverOverlay
              groomName={wedding.groom_name}
              brideName={wedding.bride_name}
              guestName={guest?.name ?? null}
              dateLabel={dateLabel}
              coverImageUrl={wedding.cover_image_url}
              showMusicHint={hasMusic && wedding.music_autoplay}
              onOpen={handleOpen}
            />
          )}
        </AnimatePresence>

        <Navbar brand={brand} sections={navSections} />

        <main>
          <HeroSection
            groomName={wedding.groom_name}
            brideName={wedding.bride_name}
            coverImageUrl={wedding.cover_image_url}
            dateLabel={dateLabel}
            venueLine={mainEvent?.venue_name ?? ''}
          />
          <CountdownSection targetDate={mainEventTarget} dateLabel={dateLabel} />
          {hasStory && <StorySection quote={wedding.opening_quote} body={wedding.story_body} />}
          {hasCouple && <CoupleSection wedding={wedding} />}
          {galleryAt('after_story') && gallerySection}
          {hasEvents && (
            <EventsSection
              events={eventsWithDetails}
              imageUrl={wedding.venue_image_url}
              hasDressCodeColors={hasDressCode && wedding.dress_code_swatches.length > 0}
            />
          )}
          {hasSchedule && <ScheduleSection items={scheduleItems} events={activeEvents} />}
          {hasDressCode && (
            <DressCodeSection
              title={wedding.dress_code_title}
              note={wedding.dress_code_note}
              avoidNote={wedding.dress_code_avoid_note}
              swatches={wedding.dress_code_swatches}
            />
          )}
          {galleryAt('after_events') && gallerySection}
          {showRegistry && (
            <RegistrySection
              accounts={wedding.bank_accounts}
              wishlistTitle={wedding.wishlist_title}
              wishlistNote={wedding.wishlist_note}
            />
          )}
          {galleryAt('before_rsvp') && gallerySection}
          <RSVPSection guest={guest}events={activeEvents.map((event) => ({ id: event.id, type: event.type }))} />
          {hasFaqs && <FAQSection faqs={faqs} />}
          <GuestbookSection guest={guest} messages={guestbook} />
          <FooterPublic groomName={wedding.groom_name} brideName={wedding.bride_name} />
        </main>

        {hasMusic && <MusicPlayer ref={musicRef} src={wedding.music_url} />}
      </div>
    </MotionConfig>
  );
}
