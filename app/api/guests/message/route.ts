import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { jsonError, jsonSuccess, jsonValidationError } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { CACHE_KEYS } from '@/lib/cacheKeys';
import { InviteMessageSchema } from '@/lib/validations';
import { sanitizeText } from '@/lib/sanitize';

// Saves the WhatsApp share template ({name}, {link}, {couple}).
export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const body = await request.json().catch(() => null);
  const parsed = InviteMessageSchema.safeParse(body);
  if (!parsed.success) return jsonValidationError(parsed.error);

  await sql`
    UPDATE wedding_config SET invite_message = ${sanitizeText(parsed.data.invite_message)}, updated_at = NOW()
    WHERE id = 'main'
  `;
  invalidateCache([CACHE_KEYS.WEDDING]);
  return jsonSuccess({ saved: true });
}
