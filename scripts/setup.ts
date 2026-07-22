import 'dotenv/config';
import { runMigrations } from '../lib/migrate';
import { hashPassword } from '../lib/hash';
import { sql } from '../lib/db';

async function setup(): Promise<void> {
  console.log('Running migrations...');
  await runMigrations();

  console.log('Creating admin user...');
  const passwordHash = await hashPassword('admin123');

  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES ('admin', ${passwordHash})
    ON CONFLICT (username) DO NOTHING
  `;

  // Only seed placeholder names on first run — never overwrite names an
  // admin has already set (this script is safe to re-run at any time).
  await sql`
    UPDATE wedding_config
    SET groom_name = 'Groom', bride_name = 'Bride'
    WHERE id = 'main' AND groom_name = '' AND bride_name = ''
  `;

  console.log('');
  console.log('✓ Setup complete.');
  console.log('✓ Log in at /admin/login with: admin / admin123');
  console.log('✓ Change the password right after your first login.');
}

setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
