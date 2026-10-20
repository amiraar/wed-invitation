import { cache } from 'react';
import { sql } from './db';
import { decodeDeep } from './sanitize';
import { defaultSettings, defaultWedding, withScheduleDefaults } from './defaults';
import type { AppSettings, EventItem, FaqItem, GalleryItem, GuestbookItem, WeddingConfig } from './types';

export type InvitationData = {
  settings: AppSettings;
  wedding: WeddingConfig;
  events: EventItem[];
  gallery: GalleryItem[];
  guestbook: GuestbookItem[];
  faqs: FaqItem[];
};

// Rows go from a server component to client components, so Date objects are
// normalized to strings and sanitized text (also inside JSON columns) is decoded back for display.
function normalizeRow<T>(row: Record<string, unknown>): T {
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      normalized[key] = value.toISOString();
    } else {
      normalized[key] = decodeDeep(value);
    }
  }
  return normalized as T;
}

// DATE columns must be formatted in local time: toISOString() could shift the
// day depending on the server timezone.
function toDateOnlyString(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}

export const getInvitationData = cache(async (): Promise<InvitationData> => {
  try {
    const [settingsRows, weddingRows, eventRows, galleryRows, guestbookRows, faqRows] = await Promise.all([
      sql`SELECT * FROM app_settings WHERE id = 'main' LIMIT 1`,
      sql`SELECT * FROM wedding_config WHERE id = 'main' LIMIT 1`,
      sql`SELECT * FROM events ORDER BY order_index ASC`,
      sql`SELECT * FROM gallery ORDER BY order_index ASC, created_at ASC`,
      // Explicit columns: this data is serialized to every visitor, so ip_address must never be selected,
      // and guests who hid their name are shown as "Someone".
      sql`SELECT id, CASE WHEN is_anonymous THEN 'Someone' ELSE name END AS name, message, is_approved, created_at FROM guestbook WHERE is_approved = TRUE ORDER BY created_at DESC LIMIT 100`,
      sql`SELECT * FROM faqs ORDER BY order_index ASC`
    ]);

    const weddingRow = weddingRows[0] ? normalizeRow<WeddingConfig>(weddingRows[0]) : defaultWedding;

    return {
      settings: settingsRows[0] ? normalizeRow<AppSettings>(settingsRows[0]) : defaultSettings,
      wedding: {
        ...weddingRow,
        bank_accounts: Array.isArray(weddingRow.bank_accounts) ? weddingRow.bank_accounts : [],
        dress_code_swatches: Array.isArray(weddingRow.dress_code_swatches) ? weddingRow.dress_code_swatches : [],
        schedule_items: Array.isArray(weddingRow.schedule_items) ? weddingRow.schedule_items.map(withScheduleDefaults) : []
      },
      events: eventRows.map((row) => ({
        ...normalizeRow<EventItem>(row),
        event_date: toDateOnlyString(row.event_date)
      })),
      gallery: galleryRows.map((row) => normalizeRow<GalleryItem>(row)),
      guestbook: guestbookRows.map((row) => normalizeRow<GuestbookItem>(row)),
      faqs: faqRows.map((row) => normalizeRow<FaqItem>(row))
    };
  } catch {
    // The invitation should still render (with placeholders) if the database
    // is unreachable.
    return {
      settings: defaultSettings,
      wedding: defaultWedding,
      events: [],
      gallery: [],
      guestbook: [],
      faqs: []
    };
  }
});
