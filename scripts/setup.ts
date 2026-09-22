import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { runMigrations } from '../lib/migrate';
import { hashPassword } from '../lib/hash';
import { sql } from '../lib/db';

async function setup(): Promise<void> {
  console.log('Running migrations...');
  await runMigrations();

  // No default password in source: use ADMIN_PASSWORD, or generate a random one shown once.
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && envPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }
  const password = envPassword || randomBytes(12).toString('base64url');

  console.log('Creating admin user...');
  const passwordHash = await hashPassword(password);

  const created = await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES ('admin', ${passwordHash})
    ON CONFLICT (username) DO NOTHING
    RETURNING id
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
  if (created.length === 0) {
    console.log('✓ Admin user already exists; its password was not changed.');
  } else if (envPassword) {
    console.log('✓ Log in at /admin/login as "admin" with the password from ADMIN_PASSWORD.');
  } else {
    console.log(`✓ Log in at /admin/login as "admin" with this generated password: ${password}`);
    console.log('✓ It is shown only once. Change it in Admin → Settings → Change Password.');
  }
}

setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
