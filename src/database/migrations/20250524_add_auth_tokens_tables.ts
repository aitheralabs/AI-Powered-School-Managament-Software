import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  // Password reset tokens table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)
  `);

  // Email verification tokens table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON email_verification_tokens(token_hash)
  `);

  // Add email_verified column to users
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false
  `);

  // Mark existing users as verified (they were created before this feature)
  await pool.query(`
    UPDATE users SET email_verified = true WHERE email_verified = false
  `);

  // Add account_locked_until column for account lockout
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0
  `);
}

export async function down(pool: Pool): Promise<void> {
  await pool.query(`DROP TABLE IF EXISTS password_reset_tokens`);
  await pool.query(`DROP TABLE IF EXISTS email_verification_tokens`);
  await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS email_verified`);
  await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS account_locked_until`);
  await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS failed_login_attempts`);
}
