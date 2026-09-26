import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { tenants, targets, auditLog } from '@pyra/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import SettingsView from '@/components/dashboard/settings-view'

export const metadata: Metadata = { title: 'Workspace Settings' }

export interface AuditLogItem {
  id: string
  action: string
  targetResource: string | null
  createdAt: Date
  rowHash: string
}

export default async function SettingsPage() {
  const ctx = await requireRole('viewer')

  let currentTenant: { id: string; name: string; plan: string } | null = null
  let targetCount = 0
  let recentAuditLogs: AuditLogItem[] = []

  if (process.env['DATABASE_URL']) {
    try {
      const data = await withTenant(ctx.tenantId, async (db) => {
        const [tenantRows, countRows, auditRows] = await Promise.all([
          db
            .select({
              id: tenants.id,
              name: tenants.name,
              plan: tenants.plan,
            })
            .from(tenants)
            .where(eq(tenants.id, ctx.tenantId))
            .limit(1),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(targets)
            .where(eq(targets.tenantId, ctx.tenantId)),
          db
            .select({
              id: auditLog.id,
              action: auditLog.action,
              targetResource: auditLog.targetResource,
              createdAt: auditLog.createdAt,
              rowHash: auditLog.rowHash,
            })
            .from(auditLog)
            .where(eq(auditLog.tenantId, ctx.tenantId))
            .orderBy(desc(auditLog.createdAt))
            .limit(10),
        ])

        return {
          tenant: tenantRows[0] ?? null,
          targetCount: countRows[0]?.count ?? 0,
          recentAuditLogs: auditRows ?? [],
        }
      })

      currentTenant = data.tenant
      targetCount = data.targetCount
      recentAuditLogs = data.recentAuditLogs
    } catch {
      currentTenant = null
      targetCount = 0
      recentAuditLogs = []
    }
  }

  const workspaceName = currentTenant?.name ?? "Kyrell's Workspace"
  const plan = currentTenant?.plan ?? 'free'

  return (
    <SettingsView
      workspaceName={workspaceName}
      tenantId={ctx.tenantId}
      plan={plan}
      targetCount={targetCount}
      recentAuditLogs={recentAuditLogs}
    />
  )
}

