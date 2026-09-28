# Pyra Disaster Recovery (DR) Specification & Runbook

This document defines the Disaster Recovery plan, Recovery Time Objective (RTO), Recovery Point Objective (RPO), and tested procedures for restoring Pyra services in the event of infrastructure failure, regional outage, or data corruption.

---

## 1. Objectives & Metrics

| Metric | Target | Measurement |
|---|---|---|
| **RTO (Recovery Time Objective)** | **< 60 minutes** | Elapsed time from incident declaration to production health check passing on `https://pyra.dev/api/health` and `/dashboard`. |
| **RPO (Recovery Point Objective)** | **< 5 minutes** | Maximum allowable data loss window. Supported by continuous WAL streaming and Neon Point-in-Time Recovery (PITR). |
| **Data Integrity Verification** | **0 Broken Chains** | Tamper-evident SHA-256 audit log chain (`audit_log`) must pass `verifyAuditChain()` across all restored tenants without error. |

---

## 2. Architecture & Failure Domains

| Component | Provider / Region | Failure Mode | Redundancy & Recovery Strategy |
|---|---|---|---|
| **Web App & APIs** | Vercel (Global Edge / Serverless) | Regional datacenter outage | Multi-region serverless failover handled automatically by Vercel edge network. |
| **Primary Database** | Neon PostgreSQL (`aws-us-east-1`) | Database corruption, accidental schema drop, or AWS outage | Continuous WAL replication, instant branching, and Point-in-Time Recovery (PITR) up to 7–30 days. |
| **Ping Worker** | Fly.io (`sin` - Singapore) | Host hardware failure or regional network partition | Dockerized worker deployed via Fly.io. Can be immediately launched in secondary region (`hkg`, `nrt`, or `syd`) with `fly deploy --region <region>`. |
| **Redis Queue & Rate Limiter** | Upstash Redis | Redis cluster partition | BullMQ stores job state in Redis with automatic reconnects and backoff. If Upstash is unavailable, rate limiting fails closed in production. |

---

## 3. Step-by-Step Restore Procedure

### Phase 1: Database Point-in-Time Restore (Neon PITR)

In the event of accidental data truncation, ransomware, or schema corruption:

1. **Identify the Recovery Timestamp:**
   Determine the target timestamp $T_{restore}$ immediately preceding the incident:
   ```bash
   # Example: 2026-09-28T10:30:00Z
   export RESTORE_TIMESTAMP="2026-09-28T10:30:00Z"
   ```

2. **Create a Restored Branch via Neon CLI:**
   ```bash
   neon branches create \
     --project-id $NEON_PROJECT_ID \
     --name "recovery-$(date +%s)" \
     --parent-timestamp "$RESTORE_TIMESTAMP"
   ```

3. **Verify Restored Permissions & Forced RLS:**
   Ensure the restored branch retains forced Row-Level Security:
   ```sql
   -- Verify RLS is enabled and forced on all tenant tables
   SELECT relname, relrowsecurity, relforcerowsecurity
   FROM pg_class
   WHERE relname IN ('tenants', 'users', 'memberships', 'targets', 'ping_logs', 'audit_log');

   -- Ensure pyra_app permissions are intact
   GRANT USAGE ON SCHEMA public TO pyra_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pyra_app;
   ```

4. **Verify Cryptographic Audit Hash Chain:**
   Run the verification script to guarantee no audit ledger tampering occurred during restore:
   ```bash
   pnpm --filter @pyra/worker exec node -e "
     import { createDb } from '@pyra/db';
     import { createAuditVerifier } from './dist/audit-verifier.js';
     const db = createDb(process.env.RECOVERED_DATABASE_URL);
     const verifier = createAuditVerifier(db);
     verifier.verifyAllTenants().then(console.log);
   "
   ```

5. **Promote the Restored Branch to Primary:**
   Update `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Vercel and Fly.io environment secrets:
   ```bash
   # Vercel
   vercel env add DATABASE_URL production
   # Fly.io
   fly secrets set DATABASE_URL="postgres://..." --app pyra-worker
   ```

---

### Phase 2: Ping Worker Recovery & Regional Failover

If the primary Fly.io worker machine in Singapore (`sin`) becomes unreachable:

1. **Check Worker Machine Status:**
   ```bash
   fly status --app pyra-worker
   ```

2. **Trigger Failover to Secondary Region:**
   Fly.io apps can be spun up in secondary regions (`nrt` Tokyo or `syd` Sydney) in under 2 minutes:
   ```bash
   # Deploy worker image to Tokyo
   fly scale count 1 --region nrt --app pyra-worker
   ```

3. **Validate Worker Health:**
   ```bash
   curl -f https://pyra-worker.fly.dev/health
   # Expected response:
   # {"status":"ok","redis":"ok","scheduler":"running","worker":"running","notifications":"running","auditVerifier":"running"}
   ```

---

### Phase 3: Cryptographic Key & Secret Compromise Recovery

If the envelope `ENCRYPTION_KEY` is compromised or needs planned rotation:

1. **Generate New 256-bit Key:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Execute Re-encryption Migration:**
   A zero-downtime rotation involves:
   - Setting `ENCRYPTION_KEY_NEW` alongside `ENCRYPTION_KEY`.
   - Running the re-encryption script: decrypt with old key, re-seal with new key, update `auth_header_encrypted` rows.
   - Recording an audit entry: `target.reencrypt_all` with row hash verification.
   - Promoting `ENCRYPTION_KEY_NEW` to primary `ENCRYPTION_KEY`.

---

## 4. Disaster Recovery Testing Cadence

- **Quarterly Tabletop Simulation:** Review team roles, escalation paths, and access tokens.
- **Bi-annual Neon Restore Drill:** Create a test branch from PITR timestamp, run `pnpm test` and `verifyAuditChain()`, and document restore duration (target < 30 minutes).
- **Automated Continuous Check:** The audit verifier background process checks hash chain integrity across all tenants every hour and alerts immediately if any link is broken.
