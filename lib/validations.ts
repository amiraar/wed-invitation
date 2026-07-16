import { z } from 'zod';

const phoneRegex = /^(\+62|62|0)8\d{7,12}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}$/;

export const RSVPSchema = z.object({
  name: z.string().min(2).max(150),
  phone: z.string().regex(phoneRegex).optional().or(z.literal('')),
  guest_count: z.number().int().min(1).max(10),
  attending_lamaran: z.boolean(),
  attending_akad: z.boolean(),
  attending_resepsi: z.boolean(),
  message: z.string().max(1000).optional().or(z.literal(''))
});

export const GuestbookSchema = z.object({
  name: z.string().min(2).max(150),
  message: z.string().min(5).max(1000)
});

export const LoginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100)
});

export const BankAccountSchema = z.object({
  bank: z.string().min(1).max(100),
  account_number: z.string().min(3).max(50),
  account_name: z.string().min(1).max(150)
});

export const WeddingConfigSchema = z.object({
  groom_name: z.string().max(100),
  bride_name: z.string().max(100),
  groom_full_name: z.string().max(150).optional().or(z.literal('')),
  bride_full_name: z.string().max(150).optional().or(z.literal('')),
  groom_parents: z.string().max(500).optional().or(z.literal('')),
  bride_parents: z.string().max(500).optional().or(z.literal('')),
  cover_image_url: z.string().max(500).optional().or(z.literal('')),
  music_url: z.string().max(500).optional().or(z.literal('')),
  music_autoplay: z.boolean(),
  opening_quote: z.string().max(500).optional().or(z.literal('')),
  bank_accounts: z.array(BankAccountSchema).max(6).optional()
});

export const EventSchema = z.object({
  type: z.enum(['lamaran', 'akad', 'resepsi']),
  is_active: z.boolean(),
  event_date: z.string().regex(dateRegex).optional().or(z.literal('')).or(z.null()),
  time_start: z.string().regex(timeRegex).optional().or(z.literal('')).or(z.null()),
  time_end: z.string().regex(timeRegex).optional().or(z.literal('')).or(z.null()),
  venue_name: z.string().max(200).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  maps_url: z.string().max(500).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  dress_code: z.string().max(100).optional().or(z.literal('')),
  order_index: z.number().int().min(0).max(10)
});

export const SettingsSchema = z.object({
  theme: z.enum(['dark', 'light']),
  cover_title: z.string().max(200),
  cover_subtitle: z.string().max(200),
  show_lamaran: z.boolean(),
  show_akad: z.boolean(),
  show_resepsi: z.boolean(),
  show_gallery: z.boolean(),
  show_envelope: z.boolean(),
  music_autoplay: z.boolean()
});
