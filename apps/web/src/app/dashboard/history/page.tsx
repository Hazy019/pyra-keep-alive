import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { pingLogs, targets } from '@pyra/db/schema'
import { eq, desc } from 'drizzle-orm'
import HistoryTable from '@/components/dashboard/history-table'
import EmptyStateIllustration from '@/components/dashboard/empty-state-illustration'
import { Activity } from 'lucide-react'

export const metadata: Metadata = { title: 'Execution History' }

export default async function HistoryPage() {
  const ctx = await requireRole('viewer')

  let recentPings: Array<{
    id: string
    targetUrl: string | null
    success: boolean
    statusCode: number | null
    latencyMs: number | null
    ranAt: Date
  }> = []

  if (process.env['DATABASE_URL']) {
    try {
      recentPings = await withTenant(ctx.tenantId, async (db) => {
        const rows = await db
          .select({
            id: pingLogs.id,
            targetUrl: targets.url,
            success: pingLogs.success,
            statusCode: pingLogs.statusCode,
            latencyMs: pingLogs.latencyMs,
            ranAt: pingLogs.ranAt,
          })
          .from(pingLogs)
          .leftJoin(targets, eq(pingLogs.targetId, targets.id))
          .where(eq(pingLogs.tenantId, ctx.tenantId))
          .orderBy(desc(pingLogs.ranAt))
          .limit(100)
        return rows
      })
    } catch {
      recentPings = []
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 6, fontSize: 24, fontWeight: 700 }}>History & Execution Logs</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Containerized audit trail of ping dispatches, HTTP status responses, and round-trip latencies.
          </p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
          <Activity size={14} style={{ color: 'var(--color-accent)' }} />
          <span>Real-time log buffer (100 runs)</span>
        </div>
      </div>

      {recentPings.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--color-text-muted)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <EmptyStateIllustration variant="history" size={120} />
          <h5 style={{ marginBottom: 6, color: 'var(--color-text)' }}>No ping logs captured yet</h5>
          <p style={{ fontSize: 14, maxWidth: 380, margin: '0 auto 24px' }}>
            When scheduled background pings run against your registered endpoints, their response codes and latencies will stream into this container.
          </p>
          <a href="/dashboard/targets" className="btn btn-primary btn-sm">
            View targets
          </a>
        </div>
      ) : (
        <HistoryTable logs={recentPings} />
      )}
    </div>
  )
}

