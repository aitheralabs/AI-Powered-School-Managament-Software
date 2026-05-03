import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  await pool.query(`
    ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS email_verified_at       TIMESTAMPTZ NULL,
      ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128) NULL
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_schools_email_verification_token
      ON schools (email_verification_token)
      WHERE email_verification_token IS NOT NULL
  `);
}

export async function down(pool: Pool): Promise<void> {
  await pool.query(`DROP INDEX IF EXISTS idx_schools_email_verification_token`);
  await pool.query(`
    ALTER TABLE schools
      DROP COLUMN IF EXISTS email_verified_at,
      DROP COLUMN IF EXISTS email_verification_token
  `);
}
