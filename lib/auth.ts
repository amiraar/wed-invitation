import { createHmac } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { NextRequest, NextResponse } from 'next/server';
import { sql } from './db';

const TOKEN_NAME = 'wed_auth';
const TOKEN_EXPIRES_DAYS = 7;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET env var is not set');
  return secret;
}

export type AuthPayload = {
  userId: string;
  username: string;
  pv: string;
  iat: number;
  exp: number;
};

// Fingerprint of the current password hash (never the hash itself). It changes whenever the
// password does, so changing the password signs out every session issued before it.
function passwordVersion(passwordHash: string): string {
  return createHmac('sha256', getSecret()).update(passwordHash).digest('base64url').slice(0, 16);
}

export function signToken(user: { id: string; username: string; password_hash: string }): string {
  const payload = { userId: user.id, username: user.username, pv: passwordVersion(user.password_hash) };
  return jwt.sign(payload, getSecret(), {
    algorithm: 'HS256',
    expiresIn: `${TOKEN_EXPIRES_DAYS}d`
  });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    // Pin the algorithm so a token can never pick its own (e.g. "none").
    return jwt.verify(token, getSecret(), { algorithms: ['HS256'] }) as AuthPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_EXPIRES_DAYS * 24 * 60 * 60
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(TOKEN_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  });
}

export function getAuthCookie(request: NextRequest): string | null {
  return request.cookies.get(TOKEN_NAME)?.value ?? null;
}

export async function verifyAuth(request: NextRequest): Promise<AuthPayload | null> {
  const token = getAuthCookie(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.pv) return null;

  const rows = await sql<{ password_hash: string }>`
    SELECT password_hash FROM admin_users WHERE id = ${payload.userId} LIMIT 1
  `;
  const user = rows[0];
  if (!user || passwordVersion(user.password_hash) !== payload.pv) return null;
  return payload;
}
