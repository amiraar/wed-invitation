import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sql } from '@/lib/db';
import { LoginSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rateLimit';
import { getClientIp, jsonError, jsonSuccess } from '@/lib/api';
import { setAuthCookie, signToken } from '@/lib/auth';
import { verifyPassword } from '@/lib/hash';

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

type AdminRow = {
  id: string;
  username: string;
  password_hash: string;
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = limiter(ip);
  if (!limit.success) {
    return jsonError('Terlalu banyak percobaan login. Coba lagi nanti.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Data login tidak valid.', 400);
  }

  const { username, password } = parsed.data;
  const rows = await sql<AdminRow>`
    SELECT id, username, password_hash
    FROM admin_users
    WHERE username = ${username}
    LIMIT 1
  `;

  const user = rows[0];
  if (!user) {
    return jsonError('Username atau password salah.', 401);
  }

  const match = await verifyPassword(password, user.password_hash);
  if (!match) {
    return jsonError('Username atau password salah.', 401);
  }

  await sql`
    UPDATE admin_users
    SET last_login = NOW()
    WHERE id = ${user.id}
  `;

  const token = signToken({ userId: user.id, username: user.username });
  const response = jsonSuccess({ userId: user.id, username: user.username });
  setAuthCookie(response, token);
  return response;
}
