/**
 * GET /api/targets  — list targets for the authenticated tenant
 * POST /api/targets — create a new target
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireRoleApi } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { listTargets, createTarget, countTargets } from '@/lib/repositories/target.repo'
import { validateTargetUrl } from '@pyra/shared/ssrf'
import { PLAN_LIMITS } from '@pyra/shared/types'
import { writeAuditLog } from '@pyra/shared/audit'
import { AUDIT_ACTIONS } from '@pyra/shared/types'
import type { AuditDb } from '@pyra/shared/audit'
import { sql } from 'drizzle-orm'
import type { DbInstance } from '@/lib/db'
import { checkRateLimit, targetCreateRatelimit } from '@/lib/ratelimit'

// ─── Zod schema (strict mode blocks mass assignment) ────────────────────────────
const createTargetSchema = z
  .object({
    url: z.string().url().max(2048),
    // Optional auth header value (plain text — encrypted before DB write)
    authHeader: z.string().max(4096).optional(),
    pingIntervalMinutes: z.number().int().min(1).max(10080).optional(), // max 1 week
  })
  .strict() // Reject any extra fields

// ─── GET ────────────────────────────────────────────────────────────────────────

export async function GET() {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('viewer')

    const result = await withTenant(ctx.tenantId, async (db) =>
      listTargets(db, ctx.tenantId),
    )

    return NextResponse.json(result, { status: 200 })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}

// ─── POST ───────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('member')

    // Rate limit: max 30 target creations per hour per tenant
    const rateLimit = await checkRateLimit(targetCreateRatelimit, ctx.tenantId)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many target creations. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000))),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        },
      )
    }

    const body: unknown = await request.json()

    // 1. Strict input validation
    const parsed = createTargetSchema.parse(body)

    // 2. SSRF validation — also returns resolved IPs for DNS-pinning context
    await validateTargetUrl(parsed.url)

    // 3. Plan limit check (in a transaction to prevent race conditions)
    return await withTenant(ctx.tenantId, async (db) => {
      // Get tenant's plan
      const tenantRows = await db.execute(
        sql`SELECT plan FROM tenants WHERE id = ${ctx.tenantId} LIMIT 1`,
      )
      const plan = ((tenantRows.rows[0] as Record<string, unknown>)?.['plan'] as string) ?? 'free'
      const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free

      // Check target count limit
      const currentCount = await countTargets(db, ctx.tenantId)
      if (currentCount >= limits.maxTargets) {
        throw Object.assign(new Error(`Plan limit reached: ${limits.maxTargets} targets maximum`), {
          statusCode: 429,
          isApiError: true,
        })
      }

      // Validate ping interval against plan limits (default: unverified minimum)
      const requestedInterval = parsed.pingIntervalMinutes ?? limits.minIntervalUnverified
      const minAllowed = limits.minIntervalUnverified
      if (requestedInterval < minAllowed) {
        throw Object.assign(
          new Error(
            `Ping interval ${requestedInterval}m is below the minimum allowed (${minAllowed}m) for unverified targets on your plan. Verify your domain to unlock shorter intervals.`,
          ),
          { statusCode: 400, isApiError: true },
        )
      }

      // 4. Encrypt auth header if provided
      let authHeaderEncrypted: Buffer | null = null
      if (parsed.authHeader) {
        const { encryptAuthHeader } = await import('@/lib/crypto')
        authHeaderEncrypted = Buffer.from(encryptAuthHeader(parsed.authHeader), 'base64')
      }

      // 5. Generate verification token
      const verificationToken = randomUUID()

      // 6. Create target
      const target = await createTarget(db, {
        tenantId: ctx.tenantId,
        url: parsed.url,
        authHeaderEncrypted,
        verified: false,
        verificationToken,
        pingIntervalMinutes: requestedInterval,
        createdBy: ctx.userId,
      })

      // 7. Audit log
      await writeAuditLog(makeAuditDb(db), {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: AUDIT_ACTIONS.TARGET_CREATED,
        targetResource: target.id,
        metadata: { url: parsed.url, pingIntervalMinutes: requestedInterval },
      })

      return NextResponse.json(
        { ...target, authHeaderEncrypted: undefined }, // never return encrypted blob
        { status: 201 },
      )
    })
  } catch (err) {
    // Handle plan limit errors
    if (
      err instanceof Error &&
      'isApiError' in err &&
      'statusCode' in err
    ) {
      const e = err as Error & { statusCode: number }
      return NextResponse.json({ error: e.message, correlationId }, { status: e.statusCode })
    }
    return handleApiError(err, correlationId)
  }

  return NextResponse.json({ error: 'Unexpected error', correlationId }, { status: 500 })
}

// ─── Audit DB adapter ─────────────────────────────────────────────────────────

function makeAuditDb(db: DbInstance): AuditDb {
  return {
    async getLastRowHash(tenantId: string): Promise<string | null> {
      const result = await db.execute(
        sql`SELECT row_hash FROM audit_log WHERE tenant_id = ${tenantId} ORDER BY created_at DESC LIMIT 1`,
      )
      const row = result.rows[0] as Record<string, unknown> | undefined
      return (row?.['row_hash'] as string) ?? null
    },
    async insertAuditRow(entry) {
      await db.execute(sql`
        INSERT INTO audit_log (id, tenant_id, actor_user_id, action, target_resource, metadata, prev_hash, row_hash, created_at)
        VALUES (
          ${entry.id},
          ${entry.tenantId},
          ${entry.actorUserId},
          ${entry.action},
          ${entry.targetResource},
          ${JSON.stringify(entry.metadata)},
          ${entry.prevHash},
          ${entry.rowHash},
          ${entry.createdAt.toISOString()}
        )
      `)
    },
  }
}
