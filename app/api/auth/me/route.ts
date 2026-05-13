import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '@/lib/api';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const payload = verifyAuth(request);
  if (!payload) {
    return jsonError('Unauthorized', 401);
  }
  return jsonSuccess({ userId: payload.userId, username: payload.username });
}
