# Changelog

All notable security, architecture, and reliability changes to Pyra are documented in this file.

## [Unreleased] - 2026-09-28

### Security & SSRF Protection
- **S-1 (SSRF Blocklist Hardening)**: Rewrote `isBlockedIp` in `@pyra/shared` using Node.js `node:net` `BlockList`. Added coverage for RFC 1918, RFC 6598 (`100.64.0.0/10`), loopback, multicast (`224.0.0.0/4`), reserved (`240.0.0.0/4`), benchmarking (`198.18.0.0/15`), and NAT64 (`64:ff9b::/96`). Added IPv4-mapped IPv6 unwrapping (`::ffff:169.254.169.254` -> `169.254.169.254`). Removed non-production fake IP fallback so all environments fail closed on invalid or private IPs.
- **S-2 (DNS Rebinding & Redirect Defense)**: Implemented `safeFetch()` in `@pyra/shared` with custom Undici `Agent` whose lookup resolver connects only to the single validated IP. Enforced `redirect: 'manual'` (treating 3xx as non-success to prevent open redirect bypasses), a 10s timeout, and a 1 MB response size cap. Integrated into target verification route, manual ping service, and worker ping execution.
- **S-3 (Fail-Closed Rate Limiting)**: Configured `lib/ratelimit.ts` to throw at startup in production if Upstash Redis credentials are missing. Added sliding-window rate limiters to `PATCH` and `DELETE` on `/api/targets/[id]` and to `/api/onboarding`. Replaced the `/api/onboarding` CSRF exemption in `middleware.ts` with strict same-origin header verification.
- **S-4 (CSP Nonce & Security Headers)**: Replaced `'unsafe-inline'` and `'unsafe-eval'` in Content Security Policy with per-request cryptographic nonces (`'strict-dynamic'`). Added `Cross-Origin-Opener-Policy: same-origin`. Narrowed `img-src` to named origins (`https://img.clerk.com`, `data:`). Removed `process.emitWarning` monkey patch in `next.config.ts`.
- **S-5 (Privacy & Self-Hosted Fonts)**: Self-hosted typography via `next/font/google` (`Inter`, `Fraunces` with optical sizing `opsz`, and `Geist_Mono`). Removed third-party Google Fonts preconnect and CDN links, removing Google Fonts from CSP `font-src` and `style-src`.

### Content Authenticity & Design System
- **TASK 6 (Anti-Slop Content Audit)**: Removed all fabricated metrics ("14.2M pings", "8,450 endpoints", "99.99% uptime", "Avg Edge RTT 18ms") and synthetic testimonials.
- **Infrastructure Truthfulness**: Replaced "global edge" claims with factual architecture: single-region worker hosted in Singapore (`sin`).
- **Cryptographic Claim Correction**: Replaced inaccurate statement with: *"Auth headers are encrypted at rest with AES-256-GCM and decrypted only inside the ping worker at request time."* Deduplicated redundant occurrences.
- **Navigation & Links**: Fixed dead links (Docs points to repository README, GitHub links point to official repository, live demo directs to dashboard sign-in).
- **TASK 7 (Design System & Accessibility)**: Adjusted contrast tokens to pass WCAG AA: `--color-text-dim: #6F6862` (5.21:1 on `#FBF9F6`), `--color-accent-btn: #C2410C` (5.18:1 with white text). Verified via `scripts/verify-contrast.mjs`.
- **UI States**: Added skeleton loading components (`loading.tsx`), empty states, global error boundary (`error.tsx`), and disabled-with-reason button states. Applied `font-variant-numeric: tabular-nums` to numbers, latencies, and timestamps.

### Trust UI & Audit Ledger
- **TASK 8 (Settings Security Checklist)**: Added live Security & Architecture checklist to Workspace Settings backed by runtime system queries (RLS table enforcement, AES-256-GCM key verification, Upstash Redis status, SSRF defense, CSP nonces).
- **Workspace Activity Page**: Created `/dashboard/activity` with a real-time cryptographic audit trail viewer. Verifies the SHA-256 hash chain (`sha256(prev_hash || action || metadata || created_at)`) on load and allows on-demand verification.
- **Hash Chain Integrity Verifier**: Strengthened `verifyAuditChain()` in `@pyra/shared` to enforce inter-row links (`rows[i].prevHash === rows[i-1].rowHash`) and genesis hash validation.
- **Scheduled Verifier Job**: Created `apps/worker/src/audit-verifier.ts` in the background worker that sweeps all tenant audit chains hourly and logs critical security alerts on any tamper detection. Added `/api/audit/verify` endpoint.

### Ops & CI/CD
- **TASK 9 (CI Workflow Re-enactment)**: Configured `.github/workflows/ci.yml` with:
  - Lint & Typecheck
  - Unit & Integration Tests (PostgreSQL test container with migrations)
  - CodeQL SAST (`security-extended`)
  - Dependency Audit (`pnpm audit --prod --audit-level critical`)
  - Worker Build & Web Build
  - Playwright E2E Suite (`tests/e2e/security-headers.spec.ts`, `targets-patch.spec.ts`, `onboarding-to-dashboard.spec.ts`)
  - `ci-status` aggregator gate for branch protection.
- **Disaster Recovery**: Authored `docs/DR.md` defining RTO (< 1 hour), RPO (< 5 minutes), Neon Point-in-Time Recovery (PITR) procedures, worker failover, and key rotation runbooks.
- **Branch Protection**: Authored `docs/BRANCH_PROTECTION.md` documenting required checks, pull request reviews, and merge gating on `main`.
