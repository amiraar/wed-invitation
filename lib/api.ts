import { NextRequest, NextResponse } from 'next/server';
import type { ZodError } from 'zod';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Names the rejected fields so the admin UI can show what to fix; never echoes values.
export function jsonValidationError(error: ZodError): NextResponse {
  const fields = error.issues.map((issue) => {
    const path = issue.path.join('.') || 'body';
    return issue.code === 'custom' ? `${path} ${issue.message}` : path;
  });
  return jsonError(`Invalid data: ${[...new Set(fields)].join(', ')}.`, 400);
}

// Route ids are UUID columns; rejecting other strings up front avoids a Postgres cast error (500).
export function isUuid(value: string): boolean {
  return uuidRegex.test(value);
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}
