import fs from 'node:fs/promises';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import { getEnv } from './env.ts';

export async function runMigrations(): Promise<void> {
  const env = getEnv();
  const sql = neon(env.DATABASE_URL);
  const schemaPath = path.join(process.cwd(), 'lib', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const sanitized = schema.replace(/--.*$/gm, '').trim();
  const statements = sanitized
    .split(';')
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  for (const statement of statements) {
    await sql(statement);
  }
}
