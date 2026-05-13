import 'dotenv/config';
import { runMigrations } from '../lib/migrate';
import { hashPassword } from '../lib/hash';
import { sql } from '../lib/db';

async function setup(): Promise<void> {
  console.log('Menjalankan migrasi...');
  await runMigrations();

  console.log('Membuat admin user...');
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

  console.log('');
  console.log('✓ Setup selesai.');
  console.log('✓ Login ke /admin/login dengan: admin / admin123');
  console.log('✓ Segera ganti password setelah login pertama.');
}

setup().catch((error) => {
  console.error('Setup gagal:', error);
  process.exit(1);
});
