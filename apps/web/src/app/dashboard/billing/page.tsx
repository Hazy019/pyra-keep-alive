import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { tenants, targets } from '@pyra/db/schema'
import { eq, sql } from 'drizzle-orm'
import BillingView from '@/components/dashboard/billing-view'

export const metadata: Metadata = { title: 'Billing & Plans' }

export default async function BillingPage() {
  const ctx = await requireRole('viewer')

  let currentTenant: { id: string; name: string; plan: string } | null = null
  let targetCount = 0

  if (process.env['DATABASE_URL']) {
    try {
      const data = await withTenant(ctx.tenantId, async (db) => {
        const [tenantRows, countRows] = await Promise.all([
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
        ])

        return {
          tenant: tenantRows[0] ?? null,
          targetCount: countRows[0]?.count ?? 0,
        }
      })

      currentTenant = data.tenant
      targetCount = data.targetCount
    } catch {
      currentTenant = null
      targetCount = 0
    }
  }

  const workspaceName = currentTenant?.name ?? "Kyrell's Workspace"
  const plan = currentTenant?.plan ?? 'free'

  return (
    <BillingView
      workspaceName={workspaceName}
      tenantId={ctx.tenantId}
      initialPlan={plan}
      targetCount={targetCount}
    />
  )
}
