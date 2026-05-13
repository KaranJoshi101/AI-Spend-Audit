-- Migration 002: Create leads table for lead capture and email collection
-- Purpose: Persistent storage for founder leads collected via LeadCaptureModal
-- Schema: Captures email, company, role, team size, and links to audit

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_name TEXT,
  role TEXT,
  team_size INT CHECK (team_size > 0),
  audit_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index on email for deduplication and rate-limiting queries
CREATE INDEX idx_leads_email ON leads(email);

-- Index on created_at for recent leads queries and cleanup jobs
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Composite index for rate-limiting: email + created_at
CREATE INDEX idx_leads_email_created_at ON leads(email, created_at DESC);

-- Enable Row Level Security (RLS) for public/read-only access
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert from authenticated users only (your backend service)
-- This prevents direct inserts from the frontend
-- Adjust auth_id() if you're using a different auth provider
CREATE POLICY insert_leads ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow read access to all leads (for your backend analytics)
-- Adjust this to restrict to your service role if needed
CREATE POLICY read_leads ON leads
  FOR SELECT
  USING (true);

-- Grant appropriate permissions
GRANT SELECT, INSERT ON leads TO authenticated;

-- Comment for documentation
COMMENT ON TABLE leads IS 'Leads captured via LeadCaptureModal after high-savings audits. Each row represents one founder email + metadata.';
COMMENT ON COLUMN leads.email IS 'Required: founder email address for follow-up';
COMMENT ON COLUMN leads.company_name IS 'Optional: company name provided by founder';
COMMENT ON COLUMN leads.role IS 'Optional: founder role (e.g., CEO, CTO, Head of Finance)';
COMMENT ON COLUMN leads.team_size IS 'Optional: team size estimate for qualification';
COMMENT ON COLUMN leads.audit_id IS 'Optional: reference back to the audit result (via public slug)';
COMMENT ON COLUMN leads.created_at IS 'Automatic: timestamp when lead was captured (UTC)';
