import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { getClientIp, jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { logSecurityEvent } from '@/lib/securityLog';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);
  logSecurityEvent('data_reset', { ip: getClientIp(request), userId: auth.userId });

  // One statement: rsvp and guestbook reference guests.
  await sql`TRUNCATE rsvp, guestbook, guests`;
  await sql`TRUNCATE gallery`;
  await sql`TRUNCATE faqs`;

  await sql`
    UPDATE events
    SET is_active = TRUE,
        event_date = NULL,
        time_start = NULL,
        time_end = NULL,
        venue_name = '',
        address = '',
        maps_url = '',
        latitude = NULL,
        longitude = NULL,
        dress_code = '',
        updated_at = NOW()
  `;

  await sql`
    UPDATE wedding_config
    SET groom_name = '',
        bride_name = '',
        groom_full_name = '',
        bride_full_name = '',
        groom_parents = '',
        bride_parents = '',
        cover_image_url = '',
        music_url = '',
        music_autoplay = FALSE,
        opening_quote = '',
        bank_accounts = '[]'::jsonb,
        story_body = '',
        venue_image_url = '',
        dress_code_title = '',
        dress_code_note = '',
        dress_code_avoid_note = '',
        dress_code_swatches = '[]'::jsonb,
        wishlist_title = '',
        wishlist_note = '',
        schedule_items = '[]'::jsonb,
        invite_message = '',
        updated_at = NOW()
    WHERE id = 'main'
  `;

  await sql`
    UPDATE app_settings
    SET theme = 'light',
        show_lamaran = TRUE,
        show_akad = TRUE,
        show_resepsi = TRUE,
        show_gallery = TRUE,
        show_envelope = TRUE,
        gallery_layout = 'masonry',
        gallery_position = 'after_events',
        updated_at = NOW()
    WHERE id = 'main'
  `;

  invalidateCache([
    CACHE_KEYS.WEDDING,
    CACHE_KEYS.SETTINGS,
    CACHE_KEYS.EVENTS,
    CACHE_KEYS.GALLERY,
    CACHE_KEYS.GUESTBOOK_PUBLIC,
    CACHE_KEYS.FAQS
  ]);

  return jsonSuccess({ reset: true });
}
