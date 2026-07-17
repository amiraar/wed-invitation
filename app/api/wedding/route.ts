import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { getCache, invalidateCache, setCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { WeddingConfigSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';
import type { WeddingConfig } from '@/lib/types';

const TTL_MS = 60 * 1000;

type WeddingRow = WeddingConfig;

export async function GET() {
  const cached = getCache<WeddingRow>(CACHE_KEYS.WEDDING);
  if (cached) return jsonSuccess(cached);

  const rows = await sql<WeddingRow>`
    SELECT * FROM wedding_config WHERE id = 'main' LIMIT 1
  `;
  const data = rows[0];
  if (!data) return jsonError('Data tidak ditemukan.', 404);

  setCache(CACHE_KEYS.WEDDING, data, TTL_MS);
  return jsonSuccess(data);
}

export async function PUT(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = WeddingConfigSchema.safeParse(body);
  if (!parsed.success) return jsonError('Data tidak valid.', 400);

  const payload = parsed.data;
  const updated = {
    groom_name: sanitizeText(payload.groom_name),
    bride_name: sanitizeText(payload.bride_name),
    groom_full_name: sanitizeText(payload.groom_full_name ?? ''),
    bride_full_name: sanitizeText(payload.bride_full_name ?? ''),
    groom_parents: sanitizeText(payload.groom_parents ?? ''),
    bride_parents: sanitizeText(payload.bride_parents ?? ''),
    cover_image_url: sanitizeText(payload.cover_image_url ?? ''),
    music_url: sanitizeText(payload.music_url ?? ''),
    music_autoplay: payload.music_autoplay,
    opening_quote: sanitizeText(payload.opening_quote ?? ''),
    bank_accounts: (payload.bank_accounts ?? []).map((account) => ({
      bank: sanitizeText(account.bank),
      account_number: sanitizeText(account.account_number),
      account_name: sanitizeText(account.account_name)
    }))
  };

  const rows = await sql<WeddingRow>`
    UPDATE wedding_config
    SET groom_name = ${updated.groom_name},
        bride_name = ${updated.bride_name},
        groom_full_name = ${updated.groom_full_name},
        bride_full_name = ${updated.bride_full_name},
        groom_parents = ${updated.groom_parents},
        bride_parents = ${updated.bride_parents},
        cover_image_url = ${updated.cover_image_url},
        music_url = ${updated.music_url},
        music_autoplay = ${updated.music_autoplay},
        opening_quote = ${updated.opening_quote},
        bank_accounts = ${JSON.stringify(updated.bank_accounts)}::jsonb,
        updated_at = NOW()
    WHERE id = 'main'
    RETURNING *
  `;

  const data = rows[0];
  invalidateCache([CACHE_KEYS.WEDDING]);
  return jsonSuccess(data);
}
