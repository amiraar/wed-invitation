export type BankAccount = {
  bank: string;
  account_number: string;
  account_name: string;
};

export type DressCodeSwatch = {
  color: string;
  label: string;
};

// A rundown item belongs to one event (its date comes from that event) or to every event ('all').
export type ScheduleItem = {
  event: EventType | 'all';
  time_start: string; // "HH:MM" or ''
  time_end: string; // "HH:MM" or ''
  title: string;
  subtitle: string;
  // Free-text time saved before start/end times existed; only shown when time_start is empty.
  time?: string;
};

export type WeddingConfig = {
  id: string;
  groom_name: string;
  bride_name: string;
  groom_full_name: string;
  bride_full_name: string;
  groom_parents: string;
  bride_parents: string;
  cover_image_url: string;
  music_url: string;
  music_autoplay: boolean;
  opening_quote: string;
  bank_accounts: BankAccount[];
  story_body: string;
  venue_image_url: string;
  dress_code_title: string;
  dress_code_note: string;
  dress_code_avoid_note: string;
  dress_code_swatches: DressCodeSwatch[];
  wishlist_title: string;
  wishlist_note: string;
  schedule_items: ScheduleItem[];
  invite_message?: string;
  updated_at: string;
};

export type EventItem = {
  id: string;
  type: 'lamaran' | 'akad' | 'resepsi';
  is_active: boolean;
  event_date: string | null;
  time_start: string | null;
  time_end: string | null;
  venue_name: string;
  address: string;
  maps_url: string;
  latitude: number | null;
  longitude: number | null;
  dress_code: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type GalleryItem = {
  id: string;
  url: string;
  caption: string;
  order_index: number;
  // 'large' takes the full width; focus is the part of the photo kept when it is cropped.
  size: 'normal' | 'large';
  focus: 'top' | 'center' | 'bottom';
  created_at: string;
};

export type GalleryLayout = 'masonry' | 'grid' | 'slideshow';
export type GalleryPosition = 'after_story' | 'after_events' | 'before_rsvp';

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
};

export type GuestbookItem = {
  id: string;
  name: string;
  message: string;
  is_approved: boolean;
  is_anonymous?: boolean;
  created_at: string;
};

export type RSVPItem = {
  id: string;
  name: string;
  phone: string | null;
  guest_count: number;
  attending_lamaran: boolean;
  attending_akad: boolean;
  attending_resepsi: boolean;
  message: string;
  created_at: string;
  guest_id?: string | null;
  group_name?: string | null;
};

export type EventType = EventItem['type'];

// The only guest data sent to the public page (no id, no phone).
export type GuestView = {
  token: string;
  name: string;
  maxGuests: number;
  invited: Record<EventType, boolean>;
  rsvp: {
    attending: boolean;
    guestCount: number;
    lamaran: boolean;
    akad: boolean;
    resepsi: boolean;
    message: string;
  } | null;
};

// Admin view of a guest with their RSVP summary.
export type GuestItem = {
  id: string;
  token: string;
  name: string;
  phone: string | null;
  max_guests: number;
  group_name: string;
  invite_lamaran: boolean;
  invite_akad: boolean;
  invite_resepsi: boolean;
  path: string;
  rsvp_status: 'attending' | 'declined' | 'pending';
  rsvp_guest_count: number | null;
  rsvp_lamaran: boolean;
  rsvp_akad: boolean;
  rsvp_resepsi: boolean;
  rsvp_message: string;
  rsvp_updated_at: string | null;
};

export type AppSettings = {
  id: string;
  theme: 'dark' | 'light';
  show_lamaran: boolean;
  show_akad: boolean;
  show_resepsi: boolean;
  show_gallery: boolean;
  show_envelope: boolean;
  gallery_layout: GalleryLayout;
  gallery_position: GalleryPosition;
  updated_at: string;
};
