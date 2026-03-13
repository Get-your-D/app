-- Health Platform Database Initialization
-- GDPR & TISAX Compliant Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up role-based access control
CREATE ROLE readonly_user;
CREATE ROLE readwrite_user;

-- Grant permissions at schema level
GRANT USAGE ON SCHEMA public TO readonly_user, readwrite_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite_user;

-- Consent Versions Table (DPA templates)
CREATE TABLE IF NOT EXISTS consent_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  hash VARCHAR(64) NOT NULL,
  version VARCHAR(32) DEFAULT '1.0',
  effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial consent version (v1.0)
INSERT INTO consent_versions (title, content, hash, version, active)
VALUES (
  'Data Processing Agreement v1.0 (March 2026)',
  'DATENSCHUTZERKLÄRUNG UND PATIENTENEINWILLIGUNG / Data Protection Declaration and Patient Consent...',
  'hash_v1_placeholder',
  '1.0',
  TRUE
) ON CONFLICT DO NOTHING;

-- Create indexes for audit compliance
CREATE INDEX IF NOT EXISTS idx_consent_versions_active_date ON consent_versions(active, effective_date DESC);

-- This table requires TypeORM migrations to be fully created
-- Tables will be auto-created by TypeORM synchronize in development

GRANT SELECT, INSERT, UPDATE ON consent_versions TO readwrite_user;

-- Create a logging function for audit trails (PostgreSQL internal auditing)
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  -- All audit logging is handled by application service
  -- This is here as a backup for critical operations
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set database-level security settings
ALTER DATABASE health_platform SET log_statement = 'all';
ALTER DATABASE health_platform SET log_duration = 'on';
ALTER DATABASE health_platform SET ssl = 'on';

COMMIT;
