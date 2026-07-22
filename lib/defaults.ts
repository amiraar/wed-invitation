import type { AppSettings, WeddingConfig } from './types';

export const defaultSettings: AppSettings = {
  id: 'main',
  theme: 'light',
  show_lamaran: true,
  show_akad: true,
  show_resepsi: true,
  show_gallery: true,
  show_envelope: true,
  updated_at: ''
};

export const defaultWedding: WeddingConfig = {
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
  bank_accounts: [],
  story_body: '',
  venue_image_url: '',
  dress_code_title: '',
  dress_code_note: '',
  dress_code_avoid_note: '',
  dress_code_swatches: [],
  wishlist_title: '',
  wishlist_note: '',
  schedule_items: [],
  updated_at: ''
};
