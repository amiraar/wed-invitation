import fs from 'node:fs/promises';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';

export async function runMigrations(): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error('DATABASE_URL env var is not set');

  const sql = neon(DATABASE_URL);
  const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const sanitized = schema.replace(/--.*$/gm, '').trim();
  const statements = sanitized
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql(statement);
  }
}
