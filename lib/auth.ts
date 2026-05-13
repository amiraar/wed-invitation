import jwt from 'jsonwebtoken';
import type { NextRequest, NextResponse } from 'next/server';

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
  iat: number;
  exp: number;
};

export function signToken(payload: { userId: string; username: string }): string {
  return jwt.sign(payload, getSecret(), {
    expiresIn: `${TOKEN_EXPIRES_DAYS}d`
  });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getSecret()) as AuthPayload;
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

export function verifyAuth(request: NextRequest): AuthPayload | null {
  const token = getAuthCookie(request);
  if (!token) return null;
  return verifyToken(token);
}
