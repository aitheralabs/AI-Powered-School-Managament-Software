/**
 * Seed: creates the first super_admin account.
 * Run: npm run db:seed
 *
 * Environment variables (required):
 *   SUPER_ADMIN_EMAIL     - email address for the super admin account
 *   SUPER_ADMIN_PASSWORD  - password (min 12 chars, must not be the default)
 *
 * Safe to run multiple times — uses ON CONFLICT DO UPDATE.
 *
 * PRODUCTION NOTE:
 *   Never pass credentials via CLI args. Set them as env vars in your
 *   secrets manager and inject them at runtime.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

// ── Guard: refuse to run with placeholder / default credentials ───────────────
const UNSAFE_PASSWORDS = [
  'SuperAdmin@123',
  'password',
  'admin',
  'changeme',
  '12345678',
  'Password@123',
];

const email    = process.env.SUPER_ADMIN_EMAIL;
const password = process.env.SUPER_ADMIN_PASSWORD;
const env      = process.env.NODE_ENV || 'development';

if (!email) {
  console.error('❌ SUPER_ADMIN_EMAIL environment variable is required.');
  process.exit(1);
}

if (!password) {
  console.error('❌ SUPER_ADMIN_PASSWORD environment variable is required.');
  process.exit(1);
}

if (password.length < 12) {
  console.error('❌ SUPER_ADMIN_PASSWORD must be at least 12 characters long.');
  process.exit(1);
}

if (UNSAFE_PASSWORDS.includes(password)) {
  console.error('❌ SUPER_ADMIN_PASSWORD is a well-known default — choose a unique strong password.');
  process.exit(1);
}

if (env === 'production' && email.endsWith('@system.com')) {
  console.error('❌ Do not use the placeholder email address in production.');
  process.exit(1);
}

// ── DB pool — reads from env, no fallback credentials ─────────────────────────
if (!process.env.DB_PASSWORD) {
  console.error('❌ DB_PASSWORD environment variable is required.');
  process.exit(1);
}

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME     || 'school_management',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function main() {
  const client = await pool.connect();
  try {
    const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
    const lastName  = process.env.SUPER_ADMIN_LAST_NAME  || 'Admin';

    const passwordHash = await bcrypt.hash(password!, 12);

    const result = await client.query(
      `INSERT INTO super_admins (email, password_hash, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             first_name    = EXCLUDED.first_name,
             last_name     = EXCLUDED.last_name,
             is_active     = true,
             updated_at    = NOW()
       RETURNING id, email`,
      [email, passwordHash, firstName, lastName],
    );

    console.log('\n✅ Super admin seeded successfully!');
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   ID:    ${result.rows[0].id}`);
    if (env !== 'production') {
      console.log(`   Env:   ${env} — password logged below for convenience`);
      console.log(`   Pass:  ${password}`);
    } else {
      console.log('   Password: [redacted in production — see SUPER_ADMIN_PASSWORD secret]');
    }
    console.log(`\n   Login at: ${process.env.APP_URL || 'http://localhost:4200'}/super-admin/login\n`);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
