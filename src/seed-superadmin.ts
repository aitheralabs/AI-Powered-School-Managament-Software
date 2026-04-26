/**
 * Seed: creates the first super_admin account.
 * Run: npm run db:seed
 *
 * Safe to run multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
 */
import * as dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME     || 'SMS',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'Kishan8051',
});

async function main() {
  const client = await pool.connect();
  try {
    const email      = process.env.SUPER_ADMIN_EMAIL    || 'superadmin@system.com';
    const password   = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
    const firstName  = 'Super';
    const lastName   = 'Admin';

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await client.query(
      `INSERT INTO super_admins (email, password_hash, first_name, last_name, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             is_active = true
       RETURNING id, email`,
      [email, passwordHash, firstName, lastName],
    );

    console.log('\n✅ Super admin seeded successfully!');
    console.log(`   Email:    ${result.rows[0].email}`);
    console.log(`   Password: ${password}`);
    console.log(`   ID:       ${result.rows[0].id}`);
    console.log('\nLogin at: http://localhost:4200/super-admin/login\n');
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
