-- ============================================================
-- Migration 025: Timetable & Exam Scheduling
-- ============================================================

-- Timetable periods
CREATE TABLE IF NOT EXISTS timetable_slots (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id      UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id      UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=Mon, 7=Sun
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    room            VARCHAR(50),
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id     UUID REFERENCES semesters(id) ON DELETE CASCADE,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent double-booking: teacher can't be in two places at once
    CONSTRAINT timetable_teacher_no_overlap UNIQUE (school_id, teacher_id, day_of_week, start_time, academic_year_id),
    -- Prevent double-booking: class can't have two subjects at once
    CONSTRAINT timetable_class_no_overlap UNIQUE (school_id, class_id, day_of_week, start_time, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_timetable_school     ON timetable_slots(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_class      ON timetable_slots(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_teacher    ON timetable_slots(school_id, teacher_id);

CREATE TRIGGER update_timetable_slots_updated_at
    BEFORE UPDATE ON timetable_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Exam schedule
CREATE TABLE IF NOT EXISTS exams (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,       -- 'Mid-Term Exam 2024'
    exam_type       VARCHAR(50) NOT NULL,        -- 'unit_test' | 'midterm' | 'final' | 'practical'
    academic_year_id UUID REFERENCES academic_years(id),
    semester_id     UUID REFERENCES semesters(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    instructions    TEXT,
    is_published    BOOLEAN DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_school ON exams(school_id);

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Individual exam paper schedule
CREATE TABLE IF NOT EXISTS exam_schedules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id   UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    exam_id     UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_date   DATE NOT NULL,
    start_time  TIME,
    end_time    TIME,
    room        VARCHAR(50),
    max_marks   NUMERIC(6,2),
    pass_marks  NUMERIC(6,2),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_schedules_school ON exam_schedules(school_id, exam_id);

-- Exam results
CREATE TABLE IF NOT EXISTS exam_results (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    exam_schedule_id    UUID NOT NULL REFERENCES exam_schedules(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained      NUMERIC(6,2),
    is_absent           BOOLEAN DEFAULT false,
    remarks             TEXT,
    entered_by          UUID REFERENCES users(id),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (school_id, exam_schedule_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_school      ON exam_results(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student     ON exam_results(student_id);

CREATE TRIGGER update_exam_results_updated_at
    BEFORE UPDATE ON exam_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
