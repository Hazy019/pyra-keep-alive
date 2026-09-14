# Pyra — Keep-Alive & Uptime Service

A platform-agnostic keep-alive and uptime service. Register any HTTP(S) endpoint and Pyra pings it on a schedule so it never pauses, sleeps, or gets forgotten.

## Monorepo structure

```
pyra/
├── apps/
│   ├── web/        # Next.js 16 App Router (marketing + dashboard)
│   └── worker/     # Fastify + BullMQ scheduler/worker fleet
├── packages/
│   ├── db/         # Drizzle ORM schema + migrations (Neon Postgres)
│   └── shared/     # SSRF validator, logger, audit writer, shared types
├── .github/
│   ├── workflows/
│   │   ├── ci.yml               # Lint → test → SAST → audit → build
│   │   └── deploy-staging.yml   # Auto-stage on main, manual prod gate
│   └── dependabot.yml
└── .env.example    # Template — copy to .env.local, never commit real values
```

## Getting started

```bash
# 1. Install pnpm (if not already)
npm install -g pnpm

# 2. Install all workspace dependencies
pnpm install

# 3. Copy env template and fill in your values
cp .env.example .env.local

# 4. Push schema to your Neon database
pnpm db:push

# 5. Start the Next.js dev server
pnpm dev:web

# 6. (Optional) Start the worker locally
pnpm dev:worker
```

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4 |
| Auth | Clerk (MFA/TOTP + WebAuthn) |
| Database | Neon serverless Postgres + Drizzle ORM |
| Queue | Upstash Redis + BullMQ |
| Worker | Fastify + Node.js on Fly.io |
| Billing | Stripe (Sprint 2) |
| CI/CD | GitHub Actions + Dependabot |

## Security highlights

- **SSRF protection**: All target URLs validated at add-time and ping-time (DNS-pinning)
- **Row-Level Security**: Postgres RLS enabled on every table; tenant isolation is enforced at the DB level
- **Tamper-evident audit log**: Hash-chained audit table (SHA-256, each row includes previous row's hash)
- **Encrypted auth headers**: AES-256-GCM envelope encryption for target credentials
- **Defense in depth**: Repository layer always checks `tenant_id` explicitly, even with RLS active
- **No secrets in git**: `.env.example` only; real values in `.env.local` (gitignored)

## Contributing

Branch protection on `main` — PRs require:
1. Lint + typecheck passing
2. All tests passing (including RLS isolation tests)
3. CodeQL SAST passing
4. `pnpm audit` passing (no high/critical CVEs)
5. One reviewer approval
