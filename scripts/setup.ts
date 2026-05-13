import 'dotenv/config';
import { runMigrations } from '../lib/migrate.ts';
import { hashPassword } from '../lib/hash.ts';
import { sql } from '../lib/db.ts';

async function setup(): Promise<void> {
  await runMigrations();

  const passwordHash = await hashPassword('admin123');

  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES ('admin', ${passwordHash})
    ON CONFLICT (username) DO NOTHING
  `;

  await sql`
    UPDATE wedding_config
    SET groom_name = 'Groom', bride_name = 'Bride'
    WHERE id = 'main'
  `;

  console.log('Setup selesai. Login ke /admin dengan admin/admin123. Segera ganti password.');
}

setup().catch((error) => {
  console.error('Setup gagal:', error);
  process.exit(1);
});
