/**
 * DELETE /api/team/members/[id]
 *
 * Removes a member from the workspace.
 * Requires admin or owner role. Owners cannot be removed.
 */

import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { requireRoleApi } from '@/lib/auth'
import { withTenant, type DbInstance } from '@/lib/db'
import { handleApiError } from '@/lib/api-error'
import { memberships } from '@pyra/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { AUDIT_ACTIONS } from '@pyra/shared/types'
import { writeAuditLog, type AuditDb } from '@pyra/shared/audit'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, ctx: RouteContext) {
  const correlationId = randomUUID()
  try {
    const { id } = await ctx.params
    const sessionCtx = await requireRoleApi('admin')

    await withTenant(sessionCtx.tenantId, async (db) => {
      // 1. Fetch membership
      const targetMembership = await db
        .select({
          id: memberships.id,
          role: memberships.role,
          tenantId: memberships.tenantId,
          userId: memberships.userId,
        })
        .from(memberships)
        .where(
          and(
            eq(memberships.id, id),
            eq(memberships.tenantId, sessionCtx.tenantId),
          ),
        )
        .limit(1)

      if (!targetMembership[0]) {
        throw Object.assign(new Error('Member not found in workspace.'), {
          statusCode: 404,
          isApiError: true,
        })
      }

      if (targetMembership[0].role === 'owner') {
        throw Object.assign(new Error('The workspace owner cannot be removed.'), {
          statusCode: 400,
          isApiError: true,
        })
      }

      // 2. Delete membership
      await db
        .delete(memberships)
        .where(
          and(
            eq(memberships.id, id),
            eq(memberships.tenantId, sessionCtx.tenantId),
          ),
        )

      // 3. Audit log
      await writeAuditLog(makeAuditDb(db), {
        tenantId: sessionCtx.tenantId,
        actorUserId: sessionCtx.userId,
        action: AUDIT_ACTIONS.MEMBER_REMOVED,
        targetResource: id,
        metadata: {
          removedMembershipId: id,
          targetRole: targetMembership[0].role,
        },
      })
    })

    return NextResponse.json({ success: true, message: 'Member removed successfully.' })
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
