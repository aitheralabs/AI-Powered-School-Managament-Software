-- ============================================================
-- Migration 023: Subscription & Billing Tables
-- ============================================================

-- Subscription plan definitions (source of truth for limits/features)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(100) UNIQUE NOT NULL,   -- 'basic', 'standard', 'premium'
    display_name        VARCHAR(100) NOT NULL,
    description         TEXT,
    price_monthly       NUMERIC(10,2) NOT NULL DEFAULT 0,
    price_yearly        NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency            VARCHAR(10) DEFAULT 'INR',
    max_students        INT NOT NULL DEFAULT 100,
    max_teachers        INT NOT NULL DEFAULT 20,
    max_staff           INT NOT NULL DEFAULT 10,
    max_storage_gb      INT NOT NULL DEFAULT 5,
    feature_ai_insights     BOOLEAN DEFAULT false,
    feature_library         BOOLEAN DEFAULT false,
    feature_transport       BOOLEAN DEFAULT false,
    feature_hostel          BOOLEAN DEFAULT false,
    feature_messaging       BOOLEAN DEFAULT true,
    feature_api_access      BOOLEAN DEFAULT false,
    is_active           BOOLEAN DEFAULT true,
    sort_order          INT DEFAULT 0,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default plans
INSERT INTO subscription_plans
    (name, display_name, description, price_monthly, price_yearly, max_students, max_teachers, max_staff, max_storage_gb, feature_ai_insights, feature_library, feature_transport, feature_hostel, feature_messaging, feature_api_access, sort_order)
VALUES
    ('trial',      'Free Trial',   '30-day full-access trial',                   0,     0,     100,  20,  10, 2,  false, false, false, false, true,  false, 0),
    ('basic',      'Basic',        'For small schools up to 300 students',        999,   9990,  300,  30,  20, 10, false, false, false, false, true,  false, 1),
    ('standard',   'Standard',     'For growing schools up to 1000 students',     2499,  24990, 1000, 80,  50, 25, true,  true,  false, false, true,  false, 2),
    ('premium',    'Premium',      'For large schools up to 3000 students',       4999,  49990, 3000, 200, 100,50, true,  true,  true,  true,  true,  true,  3),
    ('enterprise', 'Enterprise',   'Unlimited - custom pricing',                  0,     0,     999999,9999,9999,500,true, true,  true,  true,  true,  true,  4)
ON CONFLICT (name) DO NOTHING;

-- Billing events / invoice history
CREATE TABLE IF NOT EXISTS billing_events (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id           UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    event_type          VARCHAR(100) NOT NULL,   -- 'subscription.created', 'payment.succeeded', 'payment.failed', etc.
    amount              NUMERIC(10,2),
    currency            VARCHAR(10) DEFAULT 'INR',
    plan_name           VARCHAR(100),
    billing_period      VARCHAR(20),             -- 'monthly' | 'yearly'
    gateway             VARCHAR(50),             -- 'stripe' | 'razorpay' | 'manual'
    gateway_event_id    VARCHAR(255),            -- Stripe/Razorpay event ID (for dedup)
    gateway_payload     JSONB,                   -- raw webhook payload
    status              VARCHAR(50),             -- 'success' | 'failed' | 'pending'
    notes               TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_school   ON billing_events(school_id);
CREATE INDEX IF NOT EXISTS idx_billing_type     ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_gateway  ON billing_events(gateway_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_created  ON billing_events(created_at DESC);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id       UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,
    amount          NUMERIC(10,2) NOT NULL,
    tax_amount      NUMERIC(10,2) DEFAULT 0,
    total_amount    NUMERIC(10,2) NOT NULL,
    currency        VARCHAR(10) DEFAULT 'INR',
    plan_name       VARCHAR(100),
    billing_period  VARCHAR(20),
    period_start    DATE,
    period_end      DATE,
    status          VARCHAR(30) DEFAULT 'draft',  -- 'draft' | 'sent' | 'paid' | 'void'
    due_date        DATE,
    paid_at         TIMESTAMP WITH TIME ZONE,
    pdf_url         TEXT,
    gateway_invoice_id VARCHAR(255),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_school  ON invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status  ON invoices(status);

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment invoice number
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
