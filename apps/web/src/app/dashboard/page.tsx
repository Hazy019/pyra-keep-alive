import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { listTargets } from '@/lib/repositories/target.repo'
import { sql } from 'drizzle-orm'
import HeartbeatHero from '@/components/heartbeat-hero'
import Sparkline from '@/components/dashboard/sparkline'
import EmptyStateIllustration from '@/components/dashboard/empty-state-illustration'

export const metadata: Metadata = { title: 'Overview' }

interface Stats {
  total: number
  up: number
  down: number
  avgLatencyMs: number | null
}

interface TargetPing {
  success: boolean
  latencyMs: number | null
}

export default async function DashboardPage() {
  const ctx = await requireRole('viewer')

  const { targets, stats, recentPingsMap } = await withTenant(ctx.tenantId, async (db) => {
    const targetsList = await listTargets(db, ctx.tenantId)

    // 1. Stats query
    const statsResult = await db.execute(sql`
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
      WHERE t.tenant_id = ${ctx.tenantId}
    `)

    const row = statsResult.rows[0] as {
      total_targets: number
      up_count: number
      down_count: number
      avg_latency_ms: number | null
    } | undefined

    const calculatedStats: Stats = {
      total: row?.total_targets ?? targetsList.length,
      up: row?.up_count ?? 0,
      down: row?.down_count ?? 0,
      avgLatencyMs: row?.avg_latency_ms ?? null,
    }

    // 2. Recent pings query for sparklines
    const pingsMap = new Map<string, TargetPing[]>()
    if (targetsList.length > 0) {
      try {
        const pingsResult = await db.execute(sql`
          SELECT target_id, success, latency_ms, ran_at
          FROM (
            SELECT target_id, success, latency_ms, ran_at,
                   ROW_NUMBER() OVER (PARTITION BY target_id ORDER BY ran_at DESC) as rn
            FROM ping_logs
            WHERE tenant_id = ${ctx.tenantId}
          ) sub
          WHERE rn <= 20
          ORDER BY target_id, ran_at ASC
        `)
        for (const r of pingsResult.rows as any[]) {
          if (!pingsMap.has(r.target_id)) pingsMap.set(r.target_id, [])
          pingsMap.get(r.target_id)!.push({ success: Boolean(r.success), latencyMs: r.latency_ms })
        }
      } catch {
        // Fallback to empty map
      }
    }

    return {
      targets: targetsList,
      stats: calculatedStats,
      recentPingsMap: pingsMap,
    }
  })

  const uptimePct = stats.total > 0 ? Math.round((stats.up / stats.total) * 100) : 100

  return (
    <div>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h4 style={{ marginBottom: 4 }}>Overview</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Real-time status and telemetry of all your monitored targets.
        </p>
      </div>

      {/* ─── Heartbeat monitor with radial glow wash ───────────────────────── */}
      <div
        className="card"
        style={{
          marginBottom: 0,
          padding: '32px 32px 36px',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(232, 98, 44, 0.08) 0%, rgba(255, 255, 255, 0) 72%), var(--color-surface)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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

      {/* ─── Stat cards (overlapped by 16px with status tints) ─────────────── */}
      <div
        className="grid-4"
        style={{
          marginTop: -16,
          position: 'relative',
          zIndex: 2,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: 'Total targets',
            value: stats.total,
            bg: 'var(--color-surface)',
            border: 'var(--color-border)',
            color: 'var(--color-text)',
          },
          {
            label: 'Targets up',
            value: stats.up,
            bg: 'var(--tint-success-bg)',
            border: 'var(--tint-success-border)',
            color: 'var(--color-success)',
          },
          {
            label: 'Targets down',
            value: stats.down,
            bg: stats.down > 0 ? 'var(--tint-danger-bg)' : 'var(--color-surface)',
            border: stats.down > 0 ? 'var(--tint-danger-border)' : 'var(--color-border)',
            color: stats.down > 0 ? 'var(--color-error)' : 'var(--color-text)',
          },
          {
            label: 'Avg latency',
            value: stats.avgLatencyMs !== null ? `${stats.avgLatencyMs}ms` : '—',
            bg: stats.avgLatencyMs !== null && stats.avgLatencyMs > 300 ? 'var(--tint-ember-bg)' : 'var(--color-surface)',
            border: stats.avgLatencyMs !== null && stats.avgLatencyMs > 300 ? 'var(--tint-ember-border)' : 'var(--color-border)',
            color: stats.avgLatencyMs !== null && stats.avgLatencyMs > 300 ? 'var(--color-accent)' : 'var(--color-text)',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="card stat-card"
            style={{
              background: s.bg,
              borderColor: s.border,
              boxShadow: 'var(--shadow-raised)',
            }}
          >
            <span className="stat-label">{s.label}</span>
            <span className="stat-value" style={{ color: s.color }}>
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
            style={{ textAlign: 'center', padding: '52px 24px', color: 'var(--color-text-muted)' }}
          >
            <EmptyStateIllustration variant="targets" size={110} />
            <h5 style={{ marginBottom: 6, color: 'var(--color-text)' }}>No targets yet</h5>
            <p style={{ fontSize: 14, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
              Add your first endpoint to start keeping it alive and capturing live telemetry.
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
                  <th>Status & Trend</th>
                  <th>Interval</th>
                  <th>Verified</th>
                  <th>Next run</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target) => {
                  const targetPings = recentPingsMap.get(target.id) ?? []
                  const lastPing = targetPings[targetPings.length - 1]
                  const hasPinged = targetPings.length > 0

                  return (
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                          {hasPinged ? (
                            lastPing?.success ? (
                              <span className="badge badge-up">Operational</span>
                            ) : (
                              <span className="badge badge-down">Down</span>
                            )
                          ) : (
                            <span className="badge badge-pending">Pending</span>
                          )}
                          <Sparkline pings={targetPings} />
                        </div>
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
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
