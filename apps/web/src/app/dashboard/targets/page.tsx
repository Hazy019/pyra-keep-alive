import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { listTargets } from '@/lib/repositories/target.repo'
import AddTargetButton from '@/components/dashboard/add-target-button'
import { Lock } from 'lucide-react'
import EmptyStateIllustration from '@/components/dashboard/empty-state-illustration'
import Sparkline from '@/components/dashboard/sparkline'
import { sql } from 'drizzle-orm'

export const metadata: Metadata = { title: 'Targets' }

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

export default async function TargetsPage() {
  const ctx = await requireRole('viewer')
  const { targets, recentPingsMap } = await withTenant(ctx.tenantId, async (db) => {
    const [targetsList, result] = await Promise.all([
      listTargets(db, ctx.tenantId),
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

    const map = new Map<string, TargetPing[]>()
    const rows = result.rows as unknown as PingLogRow[]
    for (const r of rows) {
      if (!map.has(r.target_id)) map.set(r.target_id, [])
      map.get(r.target_id)!.push({ success: Boolean(r.success), latencyMs: r.latency_ms })
    }

    return { targets: targetsList, recentPingsMap: map }
  })

  const canAdd = ctx.role === 'owner' || ctx.role === 'admin' || ctx.role === 'member'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h4 style={{ marginBottom: 4 }}>Targets</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {targets.length} endpoint{targets.length !== 1 ? 's' : ''} monitored
          </p>
        </div>
        {canAdd && <AddTargetButton />}
      </div>

      {targets.length === 0 ? (
        <div
          className="card"
          style={{ textAlign: 'center', padding: '56px 24px' }}
        >
          <EmptyStateIllustration variant="targets" size={120} />
          <h5 style={{ marginBottom: 8 }}>No targets yet</h5>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Add your first endpoint. Pyra will start pinging it on your chosen schedule immediately.
          </p>
          {canAdd && <AddTargetButton />}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {targets.map((target) => {
            const pings = recentPingsMap.get(target.id) ?? []
            const lastPing = pings[pings.length - 1]
            const isUp = lastPing?.success
            const hasPinged = pings.length > 0

            return (
              <div
                key={target.id}
                className="card target-item-card"
              >
                {/* Left: Status dot + URL + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                  <span className={`status-dot ${hasPinged ? (isUp ? 'up' : 'down') : 'pending'}`} style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
                      }}
                    >
                      {target.url}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Every{' '}
                        {target.pingIntervalMinutes < 60
                          ? `${target.pingIntervalMinutes}m`
                          : `${Math.round(target.pingIntervalMinutes / 60)}h`}
                      </span>
                      {target.verified ? (
                        <span style={{ fontSize: 12, color: 'var(--color-success)', fontWeight: 500 }}>✓ Verified</span>
                      ) : (
                        <a
                          href={`/dashboard/targets/${target.id}/verify`}
                          style={{ fontSize: 12, color: 'var(--color-accent)', textDecoration: 'none' }}
                        >
                          Verify domain →
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right / Meta: Sparkline + Auth + View */}
                <div className="target-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  <Sparkline pings={pings} />

                  {target.authHeaderEncrypted && (
                    <span
                      title="Auth header configured"
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-muted)',
                        padding: '3px 8px',
                        background: 'var(--color-surface-2)',
                        borderRadius: 6,
                        border: '1px solid var(--color-border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Lock size={12} aria-hidden="true" /> Auth
                    </span>
                  )}

                  <a
                    href={`/dashboard/targets/${target.id}`}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 12px', fontSize: 12.5 }}
                  >
                    View →
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
