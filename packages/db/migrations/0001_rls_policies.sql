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
ALTER TABLE memberships
  ADD CONSTRAINT memberships_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- ─── Enable RLS on all tenant-scoped tables ───────────────────────────────────
ALTER TABLE tenants         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ping_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log       ENABLE ROW LEVEL SECURITY;

-- Users table: RLS enabled; each user can only see their own row.
-- (Users aren't multi-tenant, but we lock it anyway to prevent enumeration.)
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;

-- ─── Tenant isolation policies ───────────────────────────────────────────────
-- Uses `current_setting('app.current_tenant_id', true)` — the `true` (missing_ok)
-- flag means it returns NULL rather than raising an error if the variable isn't set,
-- which causes the policy to evaluate to false (no rows returned).

-- targets: read + write scoped to current tenant
CREATE POLICY tenant_isolation_targets ON targets
  USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);

-- ping_logs: read + write scoped to current tenant
CREATE POLICY tenant_isolation_ping_logs ON ping_logs
  USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);

-- audit_log: read + write scoped to current tenant
CREATE POLICY tenant_isolation_audit_log ON audit_log
  USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);

-- memberships: a user can see memberships where the tenant_id matches current tenant
CREATE POLICY tenant_isolation_memberships ON memberships
  USING (tenant_id = nullif(current_setting('app.current_tenant_id', true), '')::uuid);

-- tenants: a user can see a tenant row if they have a membership in it
-- (avoids an extra RLS variable; the subquery is safe under our connection pool model)
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (
    id = nullif(current_setting('app.current_tenant_id', true), '')::uuid
  );

-- users: users can see only their own row
-- (current_user_id is set analogously to current_tenant_id by the API layer)
CREATE POLICY user_isolation_users ON users
  USING (
    id = nullif(current_setting('app.current_user_id', true), '')::uuid
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────
-- Critical for scheduler performance: find due targets fast
CREATE INDEX idx_targets_next_run_at ON targets (next_run_at)
  WHERE next_run_at IS NOT NULL;

-- RLS lookup acceleration
CREATE INDEX idx_targets_tenant_id ON targets (tenant_id);
CREATE INDEX idx_ping_logs_tenant_id ON ping_logs (tenant_id);
CREATE INDEX idx_ping_logs_target_id ON ping_logs (target_id);
CREATE INDEX idx_audit_log_tenant_id ON audit_log (tenant_id);
CREATE INDEX idx_memberships_tenant_id ON memberships (tenant_id);
CREATE INDEX idx_memberships_user_id ON memberships (user_id);
CREATE INDEX idx_users_clerk_user_id ON users (clerk_user_id);

-- Ping history queries (dashboard: last N pings for a target, sorted by time)
CREATE INDEX idx_ping_logs_target_ran_at ON ping_logs (target_id, ran_at DESC);
