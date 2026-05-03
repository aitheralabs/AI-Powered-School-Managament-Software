-- ============================================================
-- Migration 028: SaaS Production Gaps
--
-- 1. Super-admin TOTP 2FA columns
-- 2. School dunning-workflow tracking columns
-- 3. Row-Level Security (RLS) — defence-in-depth
-- ============================================================

-- ── 1. Super-admin 2FA ─────────────────────────────────────
ALTER TABLE super_admins
  ADD COLUMN IF NOT EXISTS totp_secret      VARCHAR(64),
  ADD COLUMN IF NOT EXISTS totp_enabled     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS totp_verified_at TIMESTAMP WITH TIME ZONE;

-- ── 2. Dunning / trial-warning tracking on schools ─────────
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS dunning_step          SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dunning_started_at    TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS dunning_last_email_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS trial_warning_sent    SMALLINT NOT NULL DEFAULT 0;

-- ── 3. Row-Level Security (defence-in-depth) ────────────────
--
-- Strategy: PERMISSIVE-when-unset, RESTRICTIVE-when-set.
--
--   When app.current_school_id is NOT set (NULL) the policy is
--   transparent — the existing application-level WHERE school_id=$1
--   clauses are the sole guard.  Nothing breaks on deploy.
--
--   When the session explicitly sets app.current_school_id the DB
--   adds a second layer: every row must belong to that school,
--   even if application code forgot the WHERE clause.
--
--   Cron jobs, migrations, and super-admin code bypass via:
--     SET LOCAL app.rls_bypass = 'true';

CREATE OR REPLACE FUNCTION current_school_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_school_id', true), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION rls_bypass() RETURNS BOOLEAN AS $$
  SELECT current_setting('app.rls_bypass', true) = 'true';
$$ LANGUAGE sql STABLE;

-- students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_isolation ON students;
CREATE POLICY school_isolation ON students
  FOR ALL
  USING (
    rls_bypass()
    OR current_school_id() IS NULL
    OR school_id = current_school_id()
  )
  WITH CHECK (
    rls_bypass()
    OR current_school_id() IS NULL
    OR school_id = current_school_id()
  );

-- teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_isolation ON teachers;
CREATE POLICY school_isolation ON teachers
  FOR ALL
  USING ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() )
  WITH CHECK ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() );

-- staff
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_isolation ON staff;
CREATE POLICY school_isolation ON staff
  FOR ALL
  USING ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() )
  WITH CHECK ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() );

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_isolation ON users;
CREATE POLICY school_isolation ON users
  FOR ALL
  USING ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() )
  WITH CHECK ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() );

-- billing_events
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS school_isolation ON billing_events;
CREATE POLICY school_isolation ON billing_events
  FOR ALL
  USING ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() )
  WITH CHECK ( rls_bypass() OR current_school_id() IS NULL OR school_id = current_school_id() );
