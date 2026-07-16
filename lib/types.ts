export type BankAccount = {
  bank: string;
  account_number: string;
  account_name: string;
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
  created_at: string;
};

export type GuestbookItem = {
  id: string;
  name: string;
  message: string;
  is_approved: boolean;
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
};

export type AppSettings = {
  id: string;
  theme: 'dark' | 'light';
  cover_title: string;
  cover_subtitle: string;
  show_lamaran: boolean;
  show_akad: boolean;
  show_resepsi: boolean;
  show_gallery: boolean;
  show_envelope: boolean;
  updated_at: string;
};
