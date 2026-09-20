import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { pingLogs, targets } from '@pyra/db/schema'
import { eq, desc } from 'drizzle-orm'
import { History, CheckCircle2, XCircle } from 'lucide-react'
import EmptyStateIllustration from '@/components/dashboard/empty-state-illustration'

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
          .limit(30)
        return rows
      })
    } catch {
      recentPings = []
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ marginBottom: 4 }}>History & Execution Logs</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Recent ping requests, response codes, and round-trip latencies.
        </p>
      </div>

      {recentPings.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '56px 24px',
            color: 'var(--color-text-muted)',
          }}
        >
          <EmptyStateIllustration variant="history" size={120} />
          <h5 style={{ marginBottom: 6, color: 'var(--color-text)' }}>No ping logs yet</h5>
          <p style={{ fontSize: 14, maxWidth: 360, margin: '0 auto 20px' }}>
            When scheduled pings are executed against your registered endpoints, their response codes and latencies will appear here.
          </p>
          <a href="/dashboard/targets" className="btn btn-primary btn-sm">
            View targets
          </a>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Target URL</th>
                <th>Status</th>
                <th>HTTP Code</th>
                <th>Latency</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentPings.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }} className="truncate">
                      {p.targetUrl ?? 'Unknown Target'}
                    </span>
                  </td>
                  <td>
                    {p.success ? (
                      <span className="badge badge-up">
                        <CheckCircle2 size={12} aria-hidden="true" /> Success
                      </span>
                    ) : (
                      <span className="badge badge-down">
                        <XCircle size={12} aria-hidden="true" /> Failed
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {p.statusCode ? `${p.statusCode}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                    {p.latencyMs !== null ? `${p.latencyMs}ms` : '—'}
                  </td>
                  <td className="text-muted text-sm">
                    {new Date(p.ranAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
