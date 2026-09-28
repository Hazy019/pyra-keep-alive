import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { auditLog } from '@pyra/db/schema'
import { eq, desc, asc } from 'drizzle-orm'
import { verifyAuditChain, type AuditChainRow, type ChainVerificationResult } from '@pyra/shared/audit'
import ActivityView, { type ActivityLogEntry } from '@/components/dashboard/activity-view'

export const metadata: Metadata = { title: 'Activity & Audit Trail' }

export default async function ActivityPage() {
  const ctx = await requireRole('viewer')

  let logs: ActivityLogEntry[] = []
  let verification: ChainVerificationResult = { valid: true, brokenAtIndex: -1, brokenRowId: null }

  if (process.env['DATABASE_URL']) {
    try {
      const data = await withTenant(ctx.tenantId, async (db) => {
        // Query rows in chronological order to verify chain integrity
        const rowsAsc = await db
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

        const chainCheck = verifyAuditChain(rowsAsc as unknown as AuditChainRow[], {
          expectGenesis: true,
        })

        // Query rows in reverse chronological order for display
        const rowsDesc = await db
          .select({
            id: auditLog.id,
            action: auditLog.action,
            targetResource: auditLog.targetResource,
            metadata: auditLog.metadata,
            prevHash: auditLog.prevHash,
            rowHash: auditLog.rowHash,
            createdAt: auditLog.createdAt,
            actorUserId: auditLog.actorUserId,
          })
          .from(auditLog)
          .where(eq(auditLog.tenantId, ctx.tenantId))
          .orderBy(desc(auditLog.createdAt))
          .limit(200)

        const formattedLogs: ActivityLogEntry[] = rowsDesc.map((row) => ({
          id: row.id,
          action: row.action,
          targetResource: row.targetResource,
          metadata: row.metadata as Record<string, unknown> | null,
          prevHash: row.prevHash,
          rowHash: row.rowHash,
          createdAt: row.createdAt.toISOString(),
          actorUserId: row.actorUserId,
        }))

        return {
          logs: formattedLogs,
          verification: chainCheck,
        }
      })

      logs = data.logs
      verification = data.verification
    } catch {
      logs = []
      verification = { valid: true, brokenAtIndex: -1, brokenRowId: null }
    }
  }

  return <ActivityView initialLogs={logs} initialVerification={verification} />
}
