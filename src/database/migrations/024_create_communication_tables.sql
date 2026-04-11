-- ============================================================
-- Migration 024: Communication & Notification Tables
-- Announcements, messaging, push notification queue
-- ============================================================

-- Announcements (school-wide or targeted)
CREATE TABLE IF NOT EXISTS announcements (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    priority        VARCHAR(20) DEFAULT 'normal',  -- 'low' | 'normal' | 'high' | 'urgent'
    target_roles    TEXT[] DEFAULT ARRAY['teacher','student','parent','staff'],
    target_class_ids UUID[],                       -- NULL means all classes
    published_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published    BOOLEAN DEFAULT false,
    published_at    TIMESTAMP WITH TIME ZONE,
    expires_at      TIMESTAMP WITH TIME ZONE,
    attachments     JSONB DEFAULT '[]',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_school     ON announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published  ON announcements(school_id, is_published, published_at DESC);

CREATE TRIGGER update_announcements_updated_at
    BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Direct messages between users within a school
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject         VARCHAR(255),
    body            TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT false,
    read_at         TIMESTAMP WITH TIME ZONE,
    parent_id       UUID REFERENCES messages(id) ON DELETE SET NULL,  -- threading
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_school      ON messages(school_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient   ON messages(school_id, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_sender      ON messages(school_id, sender_id);

-- Notification queue (for email / push / SMS)
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id       UUID REFERENCES schools(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(100) NOT NULL,     -- 'fee_due', 'attendance_alert', 'grade_posted', etc.
    channel         VARCHAR(20) NOT NULL,      -- 'email' | 'sms' | 'push' | 'in_app'
    title           VARCHAR(255),
    body            TEXT,
    data            JSONB DEFAULT '{}',        -- extra payload for frontend
    status          VARCHAR(20) DEFAULT 'pending',  -- 'pending' | 'sent' | 'failed' | 'read'
    attempts        INT DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at         TIMESTAMP WITH TIME ZONE,
    read_at         TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user       ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_school     ON notifications(school_id);
CREATE INDEX IF NOT EXISTS idx_notifications_pending    ON notifications(status, created_at) WHERE status = 'pending';
