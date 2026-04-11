-- Migration: Create report export and scheduling tables
-- Description: Add tables for scheduled reports and report history

-- Create scheduled_reports table
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('attendance', 'academic', 'financial', 'enrollment', 'teacher_workload', 'class_performance', 'fee_collection', 'student_progress', 'custom')),
    parameters JSONB NOT NULL DEFAULT '{}',
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'semester', 'annual', 'custom')),
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'pdf', 'excel')),
    recipients JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    next_run_date TIMESTAMP,
    last_run_date TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report_history table
CREATE TABLE IF NOT EXISTS report_history (
    id SERIAL PRIMARY KEY,
    scheduled_report_id INTEGER REFERENCES scheduled_reports(id) ON DELETE SET NULL,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    format VARCHAR(10) NOT NULL CHECK (format IN ('json', 'csv', 'pdf', 'excel')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed')) DEFAULT 'pending',
    file_size BIGINT,
    download_url TEXT,
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_created_by ON scheduled_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_is_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run_date ON scheduled_reports(next_run_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_report_type ON scheduled_reports(report_type);

CREATE INDEX IF NOT EXISTS idx_report_history_scheduled_report_id ON report_history(scheduled_report_id);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_by ON report_history(generated_by);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_at ON report_history(generated_at);
CREATE INDEX IF NOT EXISTS idx_report_history_status ON report_history(status);
CREATE INDEX IF NOT EXISTS idx_report_history_report_type ON report_history(report_type);

-- Create sequences for ID generation
CREATE SEQUENCE IF NOT EXISTS scheduled_reports_id_seq OWNED BY scheduled_reports.id;
CREATE SEQUENCE IF NOT EXISTS report_history_id_seq OWNED BY report_history.id;

-- Set sequence values to current max + 1
SELECT setval('scheduled_reports_id_seq', COALESCE((SELECT MAX(id) FROM scheduled_reports), 0) + 1, false);
SELECT setval('report_history_id_seq', COALESCE((SELECT MAX(id) FROM report_history), 0) + 1, false);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scheduled_reports_updated_at
    BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_reports_updated_at();

-- Add comments for documentation
COMMENT ON TABLE scheduled_reports IS 'Stores scheduled report configurations for automated generation and delivery';
COMMENT ON TABLE report_history IS 'Tracks history of all generated reports including exports and scheduled reports';

COMMENT ON COLUMN scheduled_reports.parameters IS 'JSON object containing report-specific parameters (date ranges, filters, etc.)';
COMMENT ON COLUMN scheduled_reports.recipients IS 'JSON array of email addresses to receive the scheduled reports';
COMMENT ON COLUMN scheduled_reports.frequency IS 'How often the report should be generated and sent';
COMMENT ON COLUMN scheduled_reports.next_run_date IS 'When the report should next be generated';
COMMENT ON COLUMN scheduled_reports.last_run_date IS 'When the report was last successfully generated';

COMMENT ON COLUMN report_history.parameters IS 'JSON object containing the parameters used to generate this report';
COMMENT ON COLUMN report_history.file_size IS 'Size of the generated report file in bytes';
COMMENT ON COLUMN report_history.download_url IS 'URL where the generated report can be downloaded';
COMMENT ON COLUMN report_history.expires_at IS 'When the generated report file will be automatically deleted';
COMMENT ON COLUMN report_history.error IS 'Error message if report generation failed';