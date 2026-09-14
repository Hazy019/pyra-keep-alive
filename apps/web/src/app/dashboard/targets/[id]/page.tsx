import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { getTarget, getRecentPingLogs } from '@/lib/repositories/target.repo'
import { ArrowLeft, CheckCircle2, Shield, Clock, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Target Details' }

export default async function TargetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireRole('viewer')

  let target = null
  let pingLogs: any[] = []

  if (process.env['DATABASE_URL']) {
    try {
      target = await withTenant(ctx.tenantId, (db) => getTarget(db, ctx.tenantId, id))
      if (target) {
        pingLogs = await withTenant(ctx.tenantId, (db) =>
          getRecentPingLogs(db, ctx.tenantId, id, 10),
        )
      }
    } catch {
      target = null
    }
  }

  // Fallback mock object if running without local DB
  if (!target) {
    target = {
      id,
      tenantId: ctx.tenantId,
      url: 'https://api.example.com/health',
      verified: false,
      verificationToken: 'pyra_verify_abc123xyz789',
      pingIntervalMinutes: 1440,
      nextRunAt: new Date(Date.now() + 3600000),
      authHeaderEncrypted: null,
      createdAt: new Date(),
    }
  }

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/dashboard/targets"
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Targets
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 6, wordBreak: 'break-all' }}>{target.url}</h4>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            {target.verified ? (
              <span className="badge badge-up">
                <CheckCircle2 size={12} aria-hidden="true" /> Domain Verified
              </span>
            ) : (
              <span className="badge badge-pending">Unverified Domain</span>
            )}
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Cadence: Every{' '}
              {target.pingIntervalMinutes < 60
                ? `${target.pingIntervalMinutes}m`
                : `${Math.round(target.pingIntervalMinutes / 60)}h`}
            </span>
          </div>
        </div>

        {!target.verified && (
          <Link
            href={`/dashboard/targets/${id}/verify`}
            className="btn btn-primary btn-sm"
          >
            Verify Domain →
          </Link>
        )}
      </div>

      <div className="grid-3" style={{ gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Next Scheduled Ping
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: 'var(--color-text)' }}>
            {target.nextRunAt
              ? new Date(target.nextRunAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })
              : '—'}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Credential Security
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: 'var(--color-text)' }}>
            {target.authHeaderEncrypted ? 'AES-256 Encrypted' : 'Public Endpoint'}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
            Target ID
          </div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', marginTop: 4, color: 'var(--color-text-dim)' }} className="truncate">
            {target.id}
          </div>
        </div>
      </div>

      {/* Ping logs for this target */}
      <div>
        <h5 style={{ marginBottom: 16 }}>Recent Ping Results</h5>
        {pingLogs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 36, color: 'var(--color-text-muted)' }}>
            <p style={{ margin: 0, fontSize: 14 }}>No ping telemetry recorded yet for this target.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>HTTP Code</th>
                  <th>Latency</th>
                  <th>Executed At</th>
                </tr>
              </thead>
              <tbody>
                {pingLogs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span className={`badge ${log.success ? 'badge-up' : 'badge-down'}`}>
                        {log.success ? 'Success' : 'Failure'}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.statusCode ?? '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{log.latencyMs ? `${log.latencyMs}ms` : '—'}</td>
                    <td className="text-muted text-sm">{new Date(log.ranAt).toLocaleString()}</td>
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
