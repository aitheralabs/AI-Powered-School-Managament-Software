-- Fix: replace global exclusion constraint with per-school partial unique index
-- The old EXCLUDE constraint prevented ANY two rows across ALL schools from
-- having is_active = true simultaneously, which breaks multi-tenant usage.
-- The correct behaviour is: each school may have at most one active academic year.

-- Drop the global exclusion constraint
ALTER TABLE academic_years
  DROP CONSTRAINT IF EXISTS check_only_one_active_year;

-- Create a per-school partial unique index (same effect but scoped to school_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_year_per_school
  ON academic_years (school_id)
  WHERE is_active = true;
