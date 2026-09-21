import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { listTargets } from '@/lib/repositories/target.repo'
import { sql } from 'drizzle-orm'
import HeartbeatHero from '@/components/heartbeat-hero'
import Sparkline from '@/components/dashboard/sparkline'
import EmptyStateIllustration from '@/components/dashboard/empty-state-illustration'
import { Globe, Activity, ArrowUpRight, CheckCircle2, AlertTriangle, Clock, Zap, ArrowRight } from 'lucide-react'

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

interface PingLogRow {
  target_id: string
  success: boolean | number
  latency_ms: number | null
  ran_at: string | Date
}

export default async function DashboardPage() {
  const ctx = await requireRole('viewer')

  const { targets, stats, recentPingsMap } = await withTenant(ctx.tenantId, async (db) => {
    // Run independent database queries in parallel to eliminate sequential round-trip latency
    const [targetsList, statsResult, pingsResult] = await Promise.all([
      listTargets(db, ctx.tenantId),
      db.execute(sql`
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
      `),
      db
        .execute(sql`
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
        .catch(() => ({ rows: [] as unknown[] })),
    ])

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

    const pingsMap = new Map<string, TargetPing[]>()
    const rows = pingsResult.rows as unknown as PingLogRow[]
    for (const r of rows) {
      if (!pingsMap.has(r.target_id)) pingsMap.set(r.target_id, [])
      pingsMap.get(r.target_id)!.push({ success: Boolean(r.success), latencyMs: r.latency_ms })
    }

    return {
      targets: targetsList,
      stats: calculatedStats,
      recentPingsMap: pingsMap,
    }
  })

  const uptimePct = stats.total > 0 ? Math.round((stats.up / stats.total) * 100) : 100

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 6, fontSize: 24, fontWeight: 700 }}>Overview</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Real-time status and telemetry of all your monitored endpoints.
          </p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
          <span className="status-dot up" style={{ width: 7, height: 7 }} />
          <span>Live telemetry active</span>
        </div>
      </div>

      {/* ─── Heartbeat Monitor Focal Point ─────────────────────────────────── */}
      <div
        className="card"
        style={{
          padding: '28px 32px 32px',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(232, 98, 44, 0.07) 0%, rgba(255, 255, 255, 0) 70%), var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 2px 8px rgba(45, 35, 26, 0.03), 0 8px 24px rgba(45, 35, 26, 0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Activity size={15} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--color-text-muted)' }}>
                System Pulse
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 32, fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text)' }}>
                {uptimePct}%
              </span>
              <span style={{ fontSize: 14, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                overall system uptime
              </span>
            </div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: stats.down === 0 ? 'var(--tint-success-bg)' : 'var(--tint-danger-bg)', border: `1px solid ${stats.down === 0 ? 'var(--tint-success-border)' : 'var(--tint-danger-border)'}` }}>
            <span className={`status-dot ${stats.down === 0 ? 'up' : 'down'}`} style={{ width: 8, height: 8 }} />
            <span style={{ fontSize: 13, color: stats.down === 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
              {stats.down === 0 ? 'All systems operational' : `${stats.down} target${stats.down > 1 ? 's' : ''} down`}
            </span>
          </div>
        </div>
        <HeartbeatHero />
      </div>

      {/* ─── Metric Cards Grid (Organic spacing, no overlap) ───────────────── */}
      <div className="grid-4 overview-grid-4" style={{ gap: 16 }}>
        {[
          {
            label: 'Total targets',
            value: stats.total,
            icon: Globe,
            bg: 'var(--color-surface)',
            border: 'var(--color-border)',
            color: 'var(--color-text)',
            subtitle: 'Configured endpoints',
          },
          {
            label: 'Targets up',
            value: stats.up,
            icon: CheckCircle2,
            bg: 'var(--color-surface)',
            border: stats.up > 0 ? 'var(--tint-success-border)' : 'var(--color-border)',
            color: 'var(--color-success)',
            subtitle: `${uptimePct}% passing`,
          },
          {
            label: 'Targets down',
            value: stats.down,
            icon: AlertTriangle,
            bg: stats.down > 0 ? 'var(--tint-danger-bg)' : 'var(--color-surface)',
            border: stats.down > 0 ? 'var(--tint-danger-border)' : 'var(--color-border)',
            color: stats.down > 0 ? 'var(--color-error)' : 'var(--color-text-dim)',
            subtitle: stats.down > 0 ? 'Needs investigation' : 'Zero outages',
          },
          {
            label: 'Avg latency',
            value: stats.avgLatencyMs !== null ? `${stats.avgLatencyMs}ms` : '—',
            icon: Zap,
            bg: 'var(--color-surface)',
            border: stats.avgLatencyMs !== null && stats.avgLatencyMs > 300 ? 'var(--tint-ember-border)' : 'var(--color-border)',
            color: stats.avgLatencyMs !== null && stats.avgLatencyMs > 300 ? 'var(--color-accent)' : 'var(--color-text)',
            subtitle: stats.avgLatencyMs !== null ? 'Round-trip response' : 'No data yet',
          },
        ].map((s) => {
          const IconComp = s.icon
          return (
            <div
              key={s.label}
              className="card"
              style={{
                background: s.bg,
                borderColor: s.border,
                padding: '22px 24px',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 1px 3px rgba(45, 35, 26, 0.03), 0 4px 12px rgba(45, 35, 26, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform var(--duration-fast) ease, box-shadow var(--duration-fast) ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-muted)' }}>{s.label}</span>
                <span style={{ color: s.color, opacity: 0.85 }}>
                  <IconComp size={16} />
                </span>
              </div>
              <div>
                <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-heading)', color: s.color, display: 'block', lineHeight: 1.1 }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-dim)', marginTop: 6, display: 'block' }}>
                  {s.subtitle}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Targets Table ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h5 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Monitored Endpoints</h5>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              {targets.length} {targets.length === 1 ? 'target' : 'targets'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/dashboard/targets" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px' }}>
              <span>Manage Targets</span>
              <ArrowRight size={13} />
            </a>
          </div>
        </div>

        {targets.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--color-text-muted)', borderRadius: 'var(--radius-lg)' }}
          >
            <EmptyStateIllustration variant="targets" size={110} />
            <h5 style={{ marginBottom: 6, color: 'var(--color-text)' }}>No targets registered</h5>
            <p style={{ fontSize: 14, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
              Add your first endpoint to start keeping it alive and capturing live telemetry.
            </p>
            <a href="/dashboard/targets" className="btn btn-primary btn-sm">
              Add target
            </a>
          </div>
        ) : (
          <>
            {/* Desktop / Tablet View: Multi-column Table (>= 768px) */}
            <div className="table-wrapper overview-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Endpoint URL</th>
                    <th>Status & Trend</th>
                    <th>Interval</th>
                    <th>Verified</th>
                    <th>Next Execution</th>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                              <Globe size={14} />
                            </span>
                            <a
                              href={`/dashboard/targets/${target.id}`}
                              style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}
                              className="truncate"
                            >
                              {target.url}
                            </a>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                            {hasPinged ? (
                              lastPing?.success ? (
                                <span className="badge badge-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <CheckCircle2 size={12} /> Operational
                                </span>
                              ) : (
                                <span className="badge badge-down" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                  <AlertTriangle size={12} /> Down
                                </span>
                              )
                            ) : (
                              <span className="badge badge-pending">
                                <Clock size={11} style={{ marginRight: 4 }} /> Pending
                              </span>
                            )}
                            <Sparkline pings={targetPings} />
                          </div>
                        </td>
                        <td className="text-muted text-sm">
                          <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 500 }}>
                            {target.pingIntervalMinutes < 60
                              ? `${target.pingIntervalMinutes}m`
                              : `${Math.round(target.pingIntervalMinutes / 60)}h`}
                          </span>
                        </td>
                        <td>
                          {target.verified ? (
                            <span style={{ color: 'var(--color-success)', fontSize: 12.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CheckCircle2 size={13} /> Verified
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-text-dim)', fontSize: 12.5 }}>Unverified</span>
                          )}
                        </td>
                        <td className="text-muted text-sm">
                          {target.nextRunAt ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text)' }}>
                              <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
                              {new Date(target.nextRunAt).toLocaleString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Adaptive Card Stream (< 768px, No column cutoff) */}
            <div className="overview-mobile-cards">
              {targets.map((target) => {
                const targetPings = recentPingsMap.get(target.id) ?? []
                const lastPing = targetPings[targetPings.length - 1]
                const hasPinged = targetPings.length > 0

                return (
                  <div key={target.id} className="overview-target-card">
                    {/* Top line: URL + View button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                        <span style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', flexShrink: 0 }}>
                          <Globe size={12} />
                        </span>
                        <a
                          href={`/dashboard/targets/${target.id}`}
                          style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--color-text)' }}
                          className="truncate"
                        >
                          {target.url}
                        </a>
                      </div>
                      <a
                        href={`/dashboard/targets/${target.id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px', fontSize: 11.5, flexShrink: 0 }}
                      >
                        View →
                      </a>
                    </div>

                    {/* Bottom line: Status + Sparkline + Interval */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 10, fontSize: 12 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        {hasPinged ? (
                          lastPing?.success ? (
                            <span className="badge badge-up" style={{ fontSize: 11, padding: '2px 6px' }}>
                              <CheckCircle2 size={11} /> Operational
                            </span>
                          ) : (
                            <span className="badge badge-down" style={{ fontSize: 11, padding: '2px 6px' }}>
                              <AlertTriangle size={11} /> Down
                            </span>
                          )
                        ) : (
                          <span className="badge badge-pending" style={{ fontSize: 11, padding: '2px 6px' }}>
                            <Clock size={11} /> Pending
                          </span>
                        )}
                        <Sparkline pings={targetPings} />
                      </div>

                      <span style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {target.pingIntervalMinutes < 60
                          ? `${target.pingIntervalMinutes}m`
                          : `${Math.round(target.pingIntervalMinutes / 60)}h`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
