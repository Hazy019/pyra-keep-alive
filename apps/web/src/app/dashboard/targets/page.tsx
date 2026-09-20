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

export default async function TargetsPage() {
  const ctx = await requireRole('viewer')
  const { targets, recentPingsMap } = await withTenant(ctx.tenantId, async (db) => {
    const targetsList = await listTargets(db, ctx.tenantId)
    const map = new Map<string, TargetPing[]>()
    if (targetsList.length > 0) {
      try {
        const result = await db.execute(sql`
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
        for (const r of result.rows as any[]) {
          if (!map.has(r.target_id)) map.set(r.target_id, [])
          map.get(r.target_id)!.push({ success: Boolean(r.success), latencyMs: r.latency_ms })
        }
      } catch {
        // Fallback to empty map on ping_logs query error
      }
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
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease',
                }}
              >
                {/* Status dot */}
                <span className={`status-dot ${hasPinged ? (isUp ? 'up' : 'down') : 'pending'}`} />

                {/* URL + details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--color-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {target.url}
                  </p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Every{' '}
                      {target.pingIntervalMinutes < 60
                        ? `${target.pingIntervalMinutes}m`
                        : `${Math.round(target.pingIntervalMinutes / 60)}h`}
                    </span>
                    {target.verified ? (
                      <span style={{ fontSize: 12, color: 'var(--color-success)' }}>✓ Verified</span>
                    ) : (
                      <a
                        href={`/dashboard/targets/${target.id}/verify`}
                        style={{ fontSize: 12, color: 'var(--color-accent)' }}
                      >
                        Verify domain →
                      </a>
                    )}
                  </div>
                </div>

                {/* Inline Sparkline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <Sparkline pings={pings} />
                </div>

                {/* Auth indicator */}
              {target.authHeaderEncrypted && (
                <span
                  title="Auth header configured"
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-muted)',
                    padding: '3px 8px',
                    background: 'var(--color-surface-2)',
                    borderRadius: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Lock size={12} aria-hidden="true" /> Auth
                </span>
              )}

              {/* Actions */}
              <a
                href={`/dashboard/targets/${target.id}`}
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0 }}
              >
                View →
              </a>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
