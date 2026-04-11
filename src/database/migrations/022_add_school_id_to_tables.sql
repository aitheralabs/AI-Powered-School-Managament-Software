-- ============================================================
-- Migration 022: Add school_id to every data table
-- This enforces row-level tenant isolation.
-- All queries MUST include WHERE school_id = $n.
-- ============================================================

-- Users: each school has its own user pool
ALTER TABLE users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);

-- Refresh tokens inherit school from user (no separate column needed,
-- but we add it for fast invalidation of all tokens for a school)
ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_school ON refresh_tokens(school_id);

-- Academic years
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_academic_years_school ON academic_years(school_id);
-- Re-create unique constraint to be school-scoped
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_academic_years_name_school ON academic_years(school_id, name);

-- Semesters
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_semesters_school ON semesters(school_id);

-- Classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_classes_school ON classes(school_id);

-- Subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id);

-- Teachers
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers(school_id);

-- Students
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);

-- Student parents
ALTER TABLE student_parents ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_student_parents_school ON student_parents(school_id);

-- Parents (users table covers this, but if separate parents table exists)
-- ALTER TABLE parents ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;

-- Attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_attendance_school ON attendance(school_id);

-- Fee categories
ALTER TABLE fee_categories ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_fee_categories_school ON fee_categories(school_id);

-- Student fees
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_student_fees_school ON student_fees(school_id);

-- Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_payments_school ON payments(school_id);

-- Assessment types
ALTER TABLE assessment_types ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assessment_types_school ON assessment_types(school_id);

-- Grades
ALTER TABLE grades ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_grades_school ON grades(school_id);

-- Report cards
ALTER TABLE report_cards ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_report_cards_school ON report_cards(school_id);

-- Staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_staff_school ON staff(school_id);

-- Files
ALTER TABLE files ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_files_school ON files(school_id);

-- User settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES schools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_user_settings_school ON user_settings(school_id);
