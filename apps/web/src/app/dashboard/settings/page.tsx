import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { tenants } from '@pyra/db/schema'
import { eq } from 'drizzle-orm'
import { ShieldCheck, Sparkles } from 'lucide-react'

export const metadata: Metadata = { title: 'Workspace Settings' }

export default async function SettingsPage() {
  const ctx = await requireRole('viewer')

  let currentTenant: { id: string; name: string; plan: string } | null = null

  if (process.env['DATABASE_URL']) {
    try {
      currentTenant = await withTenant(ctx.tenantId, async (db) => {
        const rows = await db
          .select({
            id: tenants.id,
            name: tenants.name,
            plan: tenants.plan,
          })
          .from(tenants)
          .where(eq(tenants.id, ctx.tenantId))
          .limit(1)
        return rows[0] ?? null
      })
    } catch {
      currentTenant = null
    }
  }

  const workspaceName = currentTenant?.name ?? 'My Workspace'
  const plan = currentTenant?.plan ?? 'free'

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ marginBottom: 4 }}>Workspace Settings</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Manage your organization details, notifications, and subscription tier.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ─── Workspace Details ────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 28 }}>
          <h5 style={{ marginBottom: 4 }}>General</h5>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Basic details identifying this workspace.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Workspace Name</label>
              <input
                className="input"
                type="text"
                defaultValue={workspaceName}
                readOnly
                style={{ maxWidth: 400, background: 'var(--color-surface-2)' }}
              />
            </div>

            <div className="form-group">
              <label className="label">Tenant Identifier (RLS Scope)</label>
              <input
                className="input"
                type="text"
                defaultValue={ctx.tenantId}
                readOnly
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, maxWidth: 400, background: 'var(--color-surface-2)' }}
              />
            </div>
          </div>
        </div>

        {/* ─── Plan & Billing ───────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h5 style={{ marginBottom: 4 }}>Subscription & Plan</h5>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                Current tier: <strong style={{ textTransform: 'capitalize', color: 'var(--color-text)' }}>{plan} Plan</strong>
              </p>
            </div>
            <span className="badge badge-up" style={{ textTransform: 'capitalize', fontSize: 12 }}>
              {plan} Tier
            </span>
          </div>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Upgrade to Team Plan ($12 / seat)
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                Unlocks 1-minute high-frequency pings, 50 targets, and webhook alerting.
              </p>
            </div>
            <a href="/sign-up?plan=team" className="btn btn-primary btn-sm">
              <Sparkles size={14} aria-hidden="true" />
              Upgrade Plan
            </a>
          </div>
        </div>

        {/* ─── Security & Encryption ────────────────────────────────────────── */}
        <div className="card" style={{ padding: 28 }}>
          <h5 style={{ marginBottom: 4 }}>Security & Compliance</h5>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Cryptographic protections active on this tenant.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                  Postgres Row-Level Security Active
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                  Every query is scoped strictly to tenant {ctx.tenantId}.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={20} style={{ color: 'var(--color-success)' }} aria-hidden="true" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                  AES-256-GCM Envelope Encryption
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                  All custom Authorization headers are encrypted before reaching database storage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
