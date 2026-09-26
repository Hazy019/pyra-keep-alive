-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0001_rls_policies
-- Purpose: Enable Row-Level Security on all multi-tenant tables and create the
--          tenant-isolation policies.
--
-- Design:
--   • RLS is enabled on every table that holds tenant data.
--   • No default-allow policy exists — a table with RLS enabled but no matching
--     policy returns ZERO rows to any query (fully locked by default).
--   • The app layer sets `app.current_tenant_id` per-request via
--     `SET LOCAL app.current_tenant_id = '<uuid>'` inside a transaction.
--   • Workers use the same mechanism with a service-role connection that also
--     sets the tenant variable before any query.
--   • The `memberships` policy uses a subquery so users can only see memberships
--     in tenants they belong to.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Add role check constraint to memberships ─────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_role_check'
  ) THEN
    ALTER TABLE memberships
      ADD CONSTRAINT memberships_role_check
      CHECK (role IN ('owner', 'admin', 'member', 'viewer'));
  END IF;
END $$;

-- ─── Enable RLS on all tenant-scoped tables ───────────────────────────────────
ALTER TABLE tenants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ping_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

-- Users table: RLS enabled; each user can only see their own row.
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;

-- ─── Tenant isolation policies ───────────────────────────────────────────────
DO $$
BEGIN
  -- targets: read + write scoped to current tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_targets' AND tablename = 'targets') THEN
    CREATE POLICY tenant_isolation_targets ON targets
      USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);
  END IF;

  -- ping_logs: read + write scoped to current tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_ping_logs' AND tablename = 'ping_logs') THEN
    CREATE POLICY tenant_isolation_ping_logs ON ping_logs
      USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);
  END IF;

  -- audit_log: read + write scoped to current tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_audit_log' AND tablename = 'audit_log') THEN
    CREATE POLICY tenant_isolation_audit_log ON audit_log
      USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);
  END IF;

  -- memberships: a user can see memberships where the tenant_id matches current tenant
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_memberships' AND tablename = 'memberships') THEN
    CREATE POLICY tenant_isolation_memberships ON memberships
      USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);
  END IF;

  -- tenants: a user can see a tenant row if they have a membership in it
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tenant_isolation_tenants' AND tablename = 'tenants') THEN
    CREATE POLICY tenant_isolation_tenants ON tenants
      USING (id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);
  END IF;

  -- users: users can see only their own row
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_isolation_users' AND tablename = 'users') THEN
    CREATE POLICY user_isolation_users ON users
      USING (id = nullif(current_setting('app.current_user_id', true), '')::uuid);
  END IF;
END $$;

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- Critical for scheduler performance: find due targets fast
CREATE INDEX IF NOT EXISTS idx_targets_next_run_at ON targets (next_run_at)
  WHERE next_run_at IS NOT NULL;

-- RLS lookup acceleration
CREATE INDEX IF NOT EXISTS idx_targets_tenant_id ON targets (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ping_logs_tenant_id ON ping_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ping_logs_target_id ON ping_logs (target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log (tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON memberships (tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users (clerk_user_id);

-- Ping history queries (dashboard: last N pings for a target, sorted by time)
CREATE INDEX IF NOT EXISTS idx_ping_logs_target_ran_at ON ping_logs (target_id, ran_at DESC);

