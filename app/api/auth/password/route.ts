import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { ChangePasswordSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIp, jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/hash';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth) return jsonError('Unauthorized', 401);

  const limit = limiter(`password:${getClientIp(request)}`);
  if (!limit.success) {
    return jsonError('Too many attempts. Please try again later.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('New password must be 12 to 100 characters.', 400);
  }

  const { current_password, new_password } = parsed.data;
  const rows = await sql<{ password_hash: string }>`
    SELECT password_hash FROM admin_users WHERE id = ${auth.userId} LIMIT 1
  `;
  const user = rows[0];
  if (!user) return jsonError('Unauthorized', 401);

  const match = await verifyPassword(current_password, user.password_hash);
  if (!match) return jsonError('Current password is incorrect.', 400);

  const passwordHash = await hashPassword(new_password);
  await sql`
    UPDATE admin_users SET password_hash = ${passwordHash} WHERE id = ${auth.userId}
  `;

  return jsonSuccess({ changed: true });
}
