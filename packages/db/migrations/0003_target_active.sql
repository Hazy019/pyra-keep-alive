ALTER TABLE "targets" ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true NOT NULL;
CREATE INDEX IF NOT EXISTS "idx_targets_active_next_run" ON "targets" ("active", "next_run_at") WHERE "active" = true;
