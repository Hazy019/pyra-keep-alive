-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0002_rls_role
-- Purpose: Create application role `pyra_app`, grant table permissions, and
--          enforce ROW LEVEL SECURITY (FORCE ROW LEVEL SECURITY) even for table owners.
--
-- Note: A database administrator or deployment pipeline must run:
--   GRANT pyra_app TO <neon_connection_role>;
-- so that connection sessions can switch roles via `SET LOCAL ROLE pyra_app`.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'pyra_app') THEN
    CREATE ROLE pyra_app NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO pyra_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pyra_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pyra_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO pyra_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO pyra_app;

-- Force Row-Level Security on all tenant-scoped tables
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE targets FORCE ROW LEVEL SECURITY;
ALTER TABLE ping_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

-- Grant pyra_app to the current session user so SET LOCAL ROLE pyra_app succeeds without DBA intervention
DO $$
BEGIN
  EXECUTE format('GRANT pyra_app TO %I', CURRENT_USER);
END $$;

