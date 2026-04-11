-- ============================================================
-- Migration 021: Schools (Tenants) Table
-- This is the foundation of the multi-tenant architecture.
-- Every school is an isolated tenant. All data tables will
-- have a school_id FK pointing here.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscription plan enum
CREATE TYPE subscription_plan AS ENUM ('trial', 'basic', 'standard', 'premium', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'suspended');

-- Schools (tenants)
CREATE TABLE IF NOT EXISTS schools (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                    VARCHAR(255) NOT NULL,
    slug                    VARCHAR(100) UNIQUE NOT NULL,   -- used for subdomain: slug.yourdomain.com
    email                   VARCHAR(255) UNIQUE NOT NULL,   -- primary contact / billing email
    phone                   VARCHAR(30),
    address                 TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    country                 VARCHAR(100) DEFAULT 'India',
    postal_code             VARCHAR(20),
    logo_url                TEXT,
    website                 VARCHAR(255),
    timezone                VARCHAR(100) DEFAULT 'Asia/Kolkata',
    currency                VARCHAR(10)  DEFAULT 'INR',
    academic_year_start_month INT DEFAULT 4,               -- April (Indian academic year)

    -- Subscription
    plan                    subscription_plan DEFAULT 'trial',
    subscription_status     subscription_status DEFAULT 'trialing',
    trial_ends_at           TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    subscription_starts_at  TIMESTAMP WITH TIME ZONE,
    subscription_ends_at    TIMESTAMP WITH TIME ZONE,
    stripe_customer_id      VARCHAR(255),                  -- or Razorpay customer id
    stripe_subscription_id  VARCHAR(255),

    -- Plan limits (denormalized for fast checking)
    max_students            INT DEFAULT 100,
    max_teachers            INT DEFAULT 20,
    max_staff               INT DEFAULT 10,

    -- Feature flags (controlled per plan)
    feature_ai_insights     BOOLEAN DEFAULT false,
    feature_library         BOOLEAN DEFAULT false,
    feature_transport       BOOLEAN DEFAULT false,
    feature_hostel          BOOLEAN DEFAULT false,
    feature_messaging       BOOLEAN DEFAULT false,
    feature_api_access      BOOLEAN DEFAULT false,

    -- Metadata
    is_active               BOOLEAN DEFAULT true,
    onboarded_at            TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_schools_slug   ON schools(slug);
CREATE INDEX        IF NOT EXISTS idx_schools_email  ON schools(email);
CREATE INDEX        IF NOT EXISTS idx_schools_status ON schools(subscription_status);

CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON schools
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Super-admin users (platform operators, not school users)
-- ============================================================
CREATE TABLE IF NOT EXISTS super_admins (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_super_admins_updated_at
    BEFORE UPDATE ON super_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Audit log (platform-level, not school-level)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id   UUID REFERENCES schools(id) ON DELETE SET NULL,
    user_id     UUID,                          -- could be super_admin or school user
    user_role   VARCHAR(50),
    action      VARCHAR(100) NOT NULL,         -- e.g. 'student.create', 'payment.record'
    entity      VARCHAR(100),                  -- e.g. 'students', 'payments'
    entity_id   UUID,
    old_data    JSONB,
    new_data    JSONB,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_school  ON audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
