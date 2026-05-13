import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  await sql`TRUNCATE rsvp`;
  await sql`TRUNCATE guestbook`;
  await sql`TRUNCATE gallery`;

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
        updated_at = NOW()
    WHERE id = 'main'
  `;

  await sql`
    UPDATE app_settings
    SET theme = 'dark',
        cover_title = 'Kami Menikah',
        cover_subtitle = 'Buka undangan untuk melihat detail',
        show_lamaran = TRUE,
        show_akad = TRUE,
        show_resepsi = TRUE,
        show_gallery = TRUE,
        show_envelope = TRUE,
        updated_at = NOW()
    WHERE id = 'main'
  `;

  invalidateCache([
    CACHE_KEYS.WEDDING,
    CACHE_KEYS.SETTINGS,
    CACHE_KEYS.EVENTS,
    CACHE_KEYS.GALLERY,
    CACHE_KEYS.GUESTBOOK_PUBLIC
  ]);

  return jsonSuccess({ reset: true });
}
