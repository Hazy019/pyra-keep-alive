import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { requireRoleApi } from '@/lib/auth'
import { handleApiError } from '@/lib/api-error'
import { withTenant } from '@/lib/db'
import { auditLog } from '@pyra/db/schema'
import { eq, asc } from 'drizzle-orm'
import { verifyAuditChain, type AuditChainRow } from '@pyra/shared/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  const correlationId = randomUUID()
  try {
    const ctx = await requireRoleApi('viewer')

    const rows = await withTenant(ctx.tenantId, async (db) => {
      const records = await db
        .select({
          id: auditLog.id,
          prevHash: auditLog.prevHash,
          rowHash: auditLog.rowHash,
          action: auditLog.action,
          metadata: auditLog.metadata,
          createdAt: auditLog.createdAt,
        })
        .from(auditLog)
        .where(eq(auditLog.tenantId, ctx.tenantId))
        .orderBy(asc(auditLog.createdAt))

      return records as unknown as AuditChainRow[]
    })

    const verification = verifyAuditChain(rows, { expectGenesis: true })

    return NextResponse.json({
      success: true,
      verified: verification.valid,
      count: rows.length,
      brokenRowId: verification.brokenRowId,
      brokenAtIndex: verification.brokenAtIndex,
      reason: verification.reason ?? null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return handleApiError(err, correlationId)
  }
}
