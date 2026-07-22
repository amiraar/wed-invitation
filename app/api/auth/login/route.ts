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
    return jsonError('Too many login attempts. Please try again later.', 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('Invalid login data.', 400);
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
    return jsonError('Incorrect username or password.', 401);
  }

  const match = await verifyPassword(password, user.password_hash);
  if (!match) {
    return jsonError('Incorrect username or password.', 401);
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
