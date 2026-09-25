/**
 * PATCH /api/targets/[id]  — update a target
 * DELETE /api/targets/[id] — delete a target
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireRoleApi } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { getTarget, updateTarget, deleteTarget, getRecentPingLogs } from '@/lib/repositories/target.repo'
import { AUDIT_ACTIONS, PLAN_LIMITS } from '@pyra/shared/types'
import { sql } from 'drizzle-orm'
import type { DbInstance } from '@/lib/db'
import type { AuditDb } from '@pyra/shared/audit'
import { writeAuditLog } from '@pyra/shared/audit'
import { validateTargetUrl } from '@pyra/shared/ssrf'

interface RouteContext {
  params: Promise<{ id: string }>
}

const patchSchema = z
  .object({
    url: z.string().url().max(2048).optional(),
    pingIntervalMinutes: z.number().int().min(1).max(10080).optional(),
    authHeader: z.string().max(4096).optional().nullable(),
  })
  .strict()

// ─── GET /api/targets/[id] — get single target + recent ping history ──────────

export async function GET(_req: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRoleApi('viewer')

    const result = await withTenant(sessionCtx.tenantId, async (db) => {
      const target = await getTarget(db, sessionCtx.tenantId, id)
      if (!target) return null
      const logs = await getRecentPingLogs(db, sessionCtx.tenantId, id, 50)
      return { target: { ...target, authHeaderEncrypted: undefined }, pingLogs: logs }
    })

    if (!result) {
      return NextResponse.json({ error: 'Not found', correlationId }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(request: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRoleApi('member')
    const body: unknown = await request.json()
    const parsed = patchSchema.parse(body)

    if (parsed.url) {
      await validateTargetUrl(parsed.url)
    }

    const result = await withTenant(sessionCtx.tenantId, async (db) => {
      // Ownership check (explicit + RLS is defense in depth)
      const existing = await getTarget(db, sessionCtx.tenantId, id)
      if (!existing) return null

      // Enforce plan limits and domain verification rules on ping interval
      if (parsed.pingIntervalMinutes !== undefined) {
        const tenantRows = await db.execute(
          sql`SELECT plan FROM tenants WHERE id = ${sessionCtx.tenantId} LIMIT 1`,
        )
        const plan = ((tenantRows.rows[0] as Record<string, unknown>)?.['plan'] as string) ?? 'free'
        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.free
        const minAllowed = existing.verified
          ? limits.minIntervalVerified
          : limits.minIntervalUnverified

        if (parsed.pingIntervalMinutes < minAllowed) {
          throw Object.assign(
            new Error(
              `Ping interval cannot be less than ${minAllowed}m for ${
                existing.verified ? 'your plan' : 'an unverified target'
              }.`,
            ),
            { statusCode: 400, isApiError: true },
          )
        }
      }

      let authHeaderEncrypted: Buffer | null | undefined = undefined
      if (parsed.authHeader !== undefined) {
        if (parsed.authHeader === null) {
          authHeaderEncrypted = null
        } else {
          const { encryptAuthHeader } = await import('@/lib/crypto')
          authHeaderEncrypted = Buffer.from(encryptAuthHeader(parsed.authHeader), 'base64')
        }
      }

      const updates = {
        ...(parsed.url !== undefined && { url: parsed.url }),
        ...(parsed.pingIntervalMinutes !== undefined && { pingIntervalMinutes: parsed.pingIntervalMinutes }),
        ...(authHeaderEncrypted !== undefined && { authHeaderEncrypted }),
      }

      const updated = await updateTarget(db, sessionCtx.tenantId, id, updates)

      if (updated) {
        await writeAuditLog(makeAuditDb(db), {
          tenantId: sessionCtx.tenantId,
          actorUserId: sessionCtx.userId,
          action: AUDIT_ACTIONS.TARGET_UPDATED,
          targetResource: id,
          metadata: { fields: Object.keys(updates) },
        })
      }

      return updated
    })

    if (!result) {
      return NextResponse.json({ error: 'Not found', correlationId }, { status: 404 })
    }

    return NextResponse.json({ ...result, authHeaderEncrypted: undefined })
  } catch (err) {
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
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(_req: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRoleApi('member')

    const deleted = await withTenant(sessionCtx.tenantId, async (db) => {
      // Ownership check
      const existing = await getTarget(db, sessionCtx.tenantId, id)
      if (!existing) return false

      const ok = await deleteTarget(db, sessionCtx.tenantId, id)
      if (ok) {
        await writeAuditLog(makeAuditDb(db), {
          tenantId: sessionCtx.tenantId,
          actorUserId: sessionCtx.userId,
          action: AUDIT_ACTIONS.TARGET_DELETED,
          targetResource: id,
          metadata: { url: existing.url },
        })
      }
      return ok
    })

    if (!deleted) {
      return NextResponse.json({ error: 'Not found', correlationId }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
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
        VALUES (${entry.id}, ${entry.tenantId}, ${entry.actorUserId}, ${entry.action}, ${entry.targetResource}, ${JSON.stringify(entry.metadata)}, ${entry.prevHash}, ${entry.rowHash}, ${entry.createdAt.toISOString()})
      `)
    },
  }
}
