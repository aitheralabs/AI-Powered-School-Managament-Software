-- ============================================================
-- Migration 029: GSTIN and Tax ID Fields
--
-- Adds GSTIN (Goods and Services Tax Identification Number) for
-- Indian B2B billing compliance, plus a generic tax_id field
-- for international schools.
-- ============================================================

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS gstin VARCHAR(15),
  ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pan VARCHAR(10),
  ADD COLUMN IF NOT EXISTS billing_contact_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(30);

-- Validate GSTIN format: 15 characters (2 state + 10 PAN + 1 entity + 1 Z + 1 checksum)
CREATE OR REPLACE FUNCTION validate_gstin(gstin TEXT) RETURNS BOOLEAN AS $$
BEGIN
  IF gstin IS NULL THEN RETURN true; END IF;
  RETURN gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}[Z]{1}[A-Z0-9]{1}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint for GSTIN format
ALTER TABLE schools DROP CONSTRAINT IF EXISTS chk_schools_gstin_format;
ALTER TABLE schools ADD CONSTRAINT chk_schools_gstin_format
  CHECK (gstin IS NULL OR validate_gstin(gstin));
