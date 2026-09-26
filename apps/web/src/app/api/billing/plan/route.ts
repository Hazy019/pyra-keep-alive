import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { requireRoleApi } from '@/lib/auth'
import { withTenant, type DbInstance } from '@/lib/db'
import { countTargets } from '@/lib/repositories/target.repo'
import { PLAN_LIMITS, AUDIT_ACTIONS } from '@pyra/shared/types'
import { writeAuditLog, type AuditDb } from '@pyra/shared/audit'
import { handleApiError } from '@/lib/api-error'
import { sql } from 'drizzle-orm'

const updatePlanSchema = z
  .object({
    plan: z.enum(['free', 'team']),
  })
  .strict()

// ─── GET: Fetch current subscription & quota details ─────────────────────────

export async function GET() {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('viewer')

    return await withTenant(ctx.tenantId, async (db) => {
      const tenantRows = await db.execute(
        sql`SELECT id, name, plan FROM tenants WHERE id = ${ctx.tenantId} LIMIT 1`,
      )
      const tenant = tenantRows.rows[0] as Record<string, unknown> | undefined
      const plan = (tenant?.['plan'] as 'free' | 'team') ?? 'free'
      const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
      const targetCount = await countTargets(db, ctx.tenantId)

      return NextResponse.json({
        plan,
        limits,
        targetCount,
        workspaceName: (tenant?.['name'] as string) ?? 'Workspace',
      })
    })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}

// ─── PATCH: Switch or simulate plan upgrade / downgrade ──────────────────────

export async function PATCH(request: Request) {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('admin')

    const body: unknown = await request.json()
    const parsed = updatePlanSchema.parse(body)

    return await withTenant(ctx.tenantId, async (db) => {
      // 1. Get current plan
      const tenantRows = await db.execute(
        sql`SELECT id, name, plan FROM tenants WHERE id = ${ctx.tenantId} LIMIT 1`,
      )
      const tenant = tenantRows.rows[0] as Record<string, unknown> | undefined
      const currentPlan = (tenant?.['plan'] as 'free' | 'team') ?? 'free'

      if (currentPlan === parsed.plan) {
        return NextResponse.json({
          success: true,
          plan: parsed.plan,
          message: `Workspace is already on the ${parsed.plan} plan.`,
        })
      }

      // 2. If downgrading to free, ensure targets do not exceed free quota
      const currentTargetCount = await countTargets(db, ctx.tenantId)
      if (parsed.plan === 'free' && currentTargetCount > PLAN_LIMITS.free.maxTargets) {
        throw Object.assign(
          new Error(
            `Cannot switch to Free plan: You currently have ${currentTargetCount} endpoints, but the Free tier allows up to ${PLAN_LIMITS.free.maxTargets}. Please remove excess endpoints before downgrading.`,
          ),
          { statusCode: 400, isApiError: true },
        )
      }

      // 3. Update database
      await db.execute(
        sql`UPDATE tenants SET plan = ${parsed.plan} WHERE id = ${ctx.tenantId}`,
      )

      // 4. Record tamper-evident audit log
      const action =
        parsed.plan === 'team'
          ? AUDIT_ACTIONS.PLAN_UPGRADED
          : AUDIT_ACTIONS.PLAN_DOWNGRADED

      await writeAuditLog(makeAuditDb(db), {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action,
        targetResource: 'plan',
        metadata: {
          previousPlan: currentPlan,
          newPlan: parsed.plan,
          actor: ctx.userId,
        },
      })

      return NextResponse.json({
        success: true,
        plan: parsed.plan,
        limits: PLAN_LIMITS[parsed.plan],
        message:
          parsed.plan === 'team'
            ? 'Workspace successfully upgraded to Pyra Team plan!'
            : 'Workspace downgraded to Pyra Free tier.',
      })
    })
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
