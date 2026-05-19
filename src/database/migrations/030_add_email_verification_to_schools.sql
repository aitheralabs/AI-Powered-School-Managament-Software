-- ============================================================
-- Migration 030: Add email verification columns to schools
-- (Converts 20250503_add_email_verification_to_schools.ts to SQL)
-- ============================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS email_verified_at        TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128) NULL;

CREATE INDEX IF NOT EXISTS idx_schools_email_verification_token
  ON schools (email_verification_token)
  WHERE email_verification_token IS NOT NULL;
