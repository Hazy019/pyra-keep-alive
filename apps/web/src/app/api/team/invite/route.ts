/**
 * POST /api/team/invite
 *
 * Invites a new collaborator to the tenant workspace.
 * Requires admin or owner role and Team plan.
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { requireRoleApi } from '@/lib/auth'
import { withTenant, type DbInstance } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { memberships, users } from '@pyra/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { AUDIT_ACTIONS } from '@pyra/shared/types'
import { writeAuditLog, type AuditDb } from '@pyra/shared/audit'
import { checkRateLimit, targetVerifyRatelimit } from '@/lib/ratelimit'

const inviteSchema = z
  .object({
    email: z.string().email().max(256),
    role: z.enum(['admin', 'member', 'viewer']),
  })
  .strict()

export async function POST(request: Request) {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('admin')

    const rateLimit = await checkRateLimit(targetVerifyRatelimit, `${ctx.tenantId}:invite`)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many invitations sent recently. Please wait a moment.' },
        { status: 429 },
      )
    }

    const body: unknown = await request.json()
    const parsed = inviteSchema.parse(body)
    const normalizedEmail = parsed.email.trim().toLowerCase()

    const result = await withTenant(ctx.tenantId, async (db) => {
      // 1. Check workspace plan
      const tenantRows = await db.execute(
        sql`SELECT plan, name FROM tenants WHERE id = ${ctx.tenantId} LIMIT 1`,
      )
      const tenant = tenantRows.rows[0] as Record<string, unknown> | undefined
      const plan = (tenant?.['plan'] as string) ?? 'free'

      if (plan !== 'team') {
        throw Object.assign(
          new Error('Team member invitations are exclusively available on the Team plan. Upgrade to invite collaborators.'),
          { statusCode: 403, isApiError: true },
        )
      }

      // 2. Find or create user record
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      let userId: string
      if (existingUser[0]) {
        userId = existingUser[0].id
      } else {
        const newUsers = await db
          .insert(users)
          .values({
            email: normalizedEmail,
            clerkUserId: `invited_${randomUUID()}`,
          })
          .returning()
        userId = newUsers[0].id
      }

      // 3. Check if user is already a member
      const existingMembership = await db
        .select()
        .from(memberships)
        .where(
          and(
            eq(memberships.tenantId, ctx.tenantId),
            eq(memberships.userId, userId),
          ),
        )
        .limit(1)

      if (existingMembership[0]) {
        throw Object.assign(
          new Error(`User ${normalizedEmail} is already a member of this workspace with role "${existingMembership[0].role}".`),
          { statusCode: 409, isApiError: true },
        )
      }

      // 4. Create membership
      const newMembership = await db
        .insert(memberships)
        .values({
          tenantId: ctx.tenantId,
          userId,
          role: parsed.role,
        })
        .returning()

      // 5. Audit log
      await writeAuditLog(makeAuditDb(db), {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: AUDIT_ACTIONS.MEMBER_INVITED,
        targetResource: newMembership[0].id,
        metadata: {
          email: normalizedEmail,
          role: parsed.role,
        },
      })

      return {
        id: newMembership[0].id,
        email: normalizedEmail,
        role: parsed.role,
        createdAt: newMembership[0].createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully invited ${normalizedEmail} as ${parsed.role}.`,
      member: result,
      correlationId,
    })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}

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
