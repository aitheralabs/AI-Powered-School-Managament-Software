-- ============================================================
-- Migration 026: Fix unique constraints and grade column issues
-- ============================================================

-- 1. Fix grades unique constraint to include school_id
ALTER TABLE grades
  DROP CONSTRAINT IF EXISTS unique_student_subject_assessment_semester;

ALTER TABLE grades
  ADD CONSTRAINT unique_grade_per_school
    UNIQUE (school_id, student_id, subject_id, assessment_type_id, semester_id);

-- 2. Fix assessment_types unique constraint to be school-scoped
ALTER TABLE assessment_types
  DROP CONSTRAINT IF EXISTS unique_assessment_type_name;

ALTER TABLE assessment_types
  ADD CONSTRAINT unique_assessment_type_name_per_school
    UNIQUE (school_id, name);

-- 3. Fix report_cards unique constraint to include school_id
ALTER TABLE report_cards
  DROP CONSTRAINT IF EXISTS unique_student_semester_report;

ALTER TABLE report_cards
  ADD CONSTRAINT unique_report_card_per_school
    UNIQUE (school_id, student_id, semester_id);

-- 4. Fix the grades.percentage column
-- The column is GENERATED ALWAYS AS (computed), but the BEFORE trigger that
-- sets grade_letter runs BEFORE the generated value is computed, so grade_letter
-- ends up NULL. We fix this by converting percentage to a regular column and
-- having the trigger compute BOTH percentage and grade_letter.

-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS update_grade_letter_trigger ON grades;
DROP FUNCTION IF EXISTS update_grade_letter();

-- Drop the GENERATED ALWAYS column (recreate as regular)
ALTER TABLE grades DROP COLUMN IF EXISTS percentage;
ALTER TABLE grades ADD COLUMN percentage DECIMAL(5,2);

-- Create unified trigger function that computes percentage AND grade_letter
CREATE OR REPLACE FUNCTION compute_grade_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Compute percentage from marks
    IF NEW.total_marks IS NOT NULL AND NEW.total_marks > 0 THEN
        NEW.percentage := ROUND((NEW.marks_obtained / NEW.total_marks) * 100, 2);
    ELSE
        NEW.percentage := 0;
    END IF;

    -- Compute grade letter from percentage
    NEW.grade_letter := calculate_grade_letter(NEW.percentage);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_grade_fields_trigger
    BEFORE INSERT OR UPDATE OF marks_obtained, total_marks ON grades
    FOR EACH ROW
    EXECUTE FUNCTION compute_grade_fields();

-- Recreate index on percentage
CREATE INDEX IF NOT EXISTS idx_grades_percentage ON grades(percentage);
