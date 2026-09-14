import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { listTargets } from '@/lib/repositories/target.repo'
import { sql } from 'drizzle-orm'
import HeartbeatHero from '@/components/heartbeat-hero'
import { Target } from 'lucide-react'

export const metadata: Metadata = { title: 'Overview' }

interface Stats {
  total: number
  up: number
  down: number
  avgLatencyMs: number | null
}

async function getDashboardStats(tenantId: string, targets: Awaited<ReturnType<typeof listTargets>>) {
  return await withTenant(tenantId, async (db) => {
    // Get latest ping result per target from the last 24h
    const result = await db.execute(sql`
      SELECT
        COUNT(*)::int AS total_targets,
        SUM(CASE WHEN pl.success THEN 1 ELSE 0 END)::int AS up_count,
        SUM(CASE WHEN NOT pl.success THEN 1 ELSE 0 END)::int AS down_count,
        ROUND(AVG(pl.latency_ms))::int AS avg_latency_ms
      FROM targets t
      LEFT JOIN LATERAL (
        SELECT success, latency_ms FROM ping_logs
        WHERE target_id = t.id
        ORDER BY ran_at DESC
        LIMIT 1
      ) pl ON true
      WHERE t.tenant_id = ${tenantId}
    `)

    const row = result.rows[0] as {
      total_targets: number
      up_count: number
      down_count: number
      avg_latency_ms: number | null
    } | undefined

    return {
      total: row?.total_targets ?? targets.length,
      up: row?.up_count ?? 0,
      down: row?.down_count ?? 0,
      avgLatencyMs: row?.avg_latency_ms ?? null,
    } satisfies Stats
  })
}

export default async function DashboardPage() {
  const ctx = await requireRole('viewer')

  const targets = await withTenant(ctx.tenantId, (db) => listTargets(db, ctx.tenantId))
  const stats = await getDashboardStats(ctx.tenantId, targets)

  const uptimePct = stats.total > 0 ? Math.round((stats.up / stats.total) * 100) : 100

  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ marginBottom: 4 }}>Overview</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Real-time status of all your monitored targets.
        </p>
      </div>

      {/* ─── Heartbeat monitor ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24, padding: '32px 32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 4 }}>
              System pulse
            </p>
            <p style={{ fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
              {uptimePct}% uptime
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`status-dot ${stats.down === 0 ? 'up' : 'down'}`} />
            <span style={{ fontSize: 13, color: stats.down === 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 500 }}>
              {stats.down === 0 ? 'All systems operational' : `${stats.down} target${stats.down > 1 ? 's' : ''} down`}
            </span>
          </div>
        </div>
        <HeartbeatHero />
      </div>

      {/* ─── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total targets', value: stats.total },
          { label: 'Targets up', value: stats.up, color: 'var(--color-success)' },
          { label: 'Targets down', value: stats.down, color: stats.down > 0 ? 'var(--color-error)' : undefined },
          {
            label: 'Avg latency',
            value: stats.avgLatencyMs !== null ? `${stats.avgLatencyMs}ms` : '—',
          },
        ].map((s) => (
          <div key={s.label} className="card stat-card">
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={s.color ? { color: s.color } : {}}>
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Targets table ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h5>Monitored Targets</h5>
          <a href="/dashboard/targets" className="btn btn-secondary btn-sm">
            Manage →
          </a>
        </div>

        {targets.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--color-text-muted)' }}
          >
            <Target size={36} style={{ margin: '0 auto 12px', color: 'var(--color-text-dim)', display: 'block' }} aria-hidden="true" />
            <p style={{ fontWeight: 500, marginBottom: 8 }}>No targets yet</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>
              Add your first endpoint to start keeping it alive.
            </p>
            <a href="/dashboard/targets" className="btn btn-primary btn-sm">
              Add target
            </a>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Status</th>
                  <th>Interval</th>
                  <th>Verified</th>
                  <th>Next run</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => (
                  <tr key={target.id}>
                    <td>
                      <a
                        href={`/dashboard/targets/${target.id}`}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                        className="truncate"
                      >
                        {target.url}
                      </a>
                    </td>
                    <td>
                      <span className="badge badge-pending">Pending</span>
                    </td>
                    <td className="text-muted text-sm">
                      {target.pingIntervalMinutes < 60
                        ? `${target.pingIntervalMinutes}m`
                        : `${Math.round(target.pingIntervalMinutes / 60)}h`}
                    </td>
                    <td>
                      {target.verified ? (
                        <span style={{ color: 'var(--color-success)', fontSize: 13 }}>✓ Verified</span>
                      ) : (
                        <span style={{ color: 'var(--color-text-dim)', fontSize: 13 }}>Unverified</span>
                      )}
                    </td>
                    <td className="text-muted text-sm">
                      {target.nextRunAt
                        ? new Date(target.nextRunAt).toLocaleString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
