import { neon } from '@neondatabase/serverless';

type SqlTag = <T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<T[]>;

let client: SqlTag | null = null;

function getClient(): SqlTag {
  if (!client) {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) throw new Error('DATABASE_URL env var is not set');
    client = neon(DATABASE_URL) as unknown as SqlTag;
  }
  return client;
}

// Lazy init so importing this module never throws (e.g. during `next build`
// without env vars); the connection is only created on the first query.
export const sql: SqlTag = <T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => getClient()<T>(strings, ...values);
