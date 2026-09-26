'use client'

import { useState } from 'react'
import {
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Database,
  Server,
  Zap,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react'

interface SettingsViewProps {
  workspaceName: string
  tenantId: string
  plan: string
  targetCount: number
}

export default function SettingsView({
  workspaceName,
  tenantId,
  plan,
  targetCount,
}: SettingsViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(tenantId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maxTargets = plan === 'team' ? 50 : plan === 'enterprise' ? 500 : 10
  const quotaPercent = Math.min(100, Math.round((targetCount / maxTargets) * 100))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36, width: '100%' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h4 style={{ marginBottom: 6, fontSize: 24, fontWeight: 700 }}>Workspace Settings</h4>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Manage your organization profile, multi-tenant isolation policies, and subscription tier.
          </p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', fontSize: 12.5, color: 'var(--color-text-muted)' }}>
          <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
          <span>Tenant RLS Active</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 36, width: '100%' }}>
        {/* ─── Section 1: Workspace Identity ────────────────────────────────── */}
        <div className="settings-section-row">
          <div className="settings-info-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Layers size={18} style={{ color: 'var(--color-accent)' }} />
              <h5>Workspace Identity</h5>
            </div>
            <p>
              Your organization credentials and unique cryptographic tenant identifier used to scope all database operations.
            </p>
          </div>

          <div className="settings-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="label" style={{ fontSize: 13, fontWeight: 600 }}>Workspace Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    type="text"
                    defaultValue={workspaceName}
                    readOnly
                    style={{
                      background: 'var(--color-surface-2)',
                      fontSize: 14,
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-dim)', marginTop: 6, display: 'block' }}>
                  Display label used across the Pyra dashboard and alerting channels.
                </span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="label" style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                    Tenant Identifier (Postgres RLS Scope)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`copy-button ${copied ? 'copied' : ''}`}
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        <span>Copied to clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Tenant UUID</span>
                      </>
                    )}
                  </button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    color: 'var(--color-text)',
                    wordBreak: 'break-all',
                  }}
                >
                  {tenantId}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <ShieldCheck size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Row-Level Security enforces that every query is bound to this UUID. Data is cryptographically separated from all other tenants.
                  </span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-dim)', display: 'block', marginBottom: 4 }}>
                    Database Region
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text)' }}>
                    <Server size={14} style={{ color: 'var(--color-accent)' }} />
                    <span>Neon Serverless (AWS us-east-1)</span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-text-dim)', display: 'block', marginBottom: 4 }}>
                    Application Role
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text)' }}>
                    <Database size={14} style={{ color: 'var(--color-success)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>pyra_app (RLS strictly enforced)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 2: Subscription & Usage Quotas ───────────────────────── */}
        <div className="settings-section-row">
          <div className="settings-info-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Zap size={18} style={{ color: 'var(--color-accent)' }} />
              <h5>Plan & Quota Limits</h5>
            </div>
            <p>
              Review your current capacity limits, ping frequency intervals, and upgrade options for high-throughput teams.
            </p>
          </div>

          <div className="settings-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-dim)', display: 'block', marginBottom: 4 }}>
                  Active Subscription
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                  {plan} Tier
                </span>
              </div>
              <span className="badge badge-up" style={{ fontSize: 12, textTransform: 'capitalize', padding: '4px 12px' }}>
                {plan} Plan Active
              </span>
            </div>

            {/* Quota Progress Meter */}
            <div style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Endpoint Utilization</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  <strong>{targetCount}</strong> of <strong>{maxTargets}</strong> targets used ({quotaPercent}%)
                </span>
              </div>
              <div style={{ width: '100%', height: 8, borderRadius: 'var(--radius-full)', background: 'var(--color-border)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${quotaPercent}%`,
                    height: '100%',
                    borderRadius: 'var(--radius-full)',
                    background: quotaPercent > 80 ? 'var(--color-accent)' : 'var(--color-success)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                <span>Ping interval: <strong>5 minutes</strong></span>
                <span>History retention: <strong>30 days</strong></span>
                <span>Alerting: <strong>Email</strong></span>
              </div>
            </div>

            {/* Upgrade Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(232, 98, 44, 0.06) 0%, rgba(255, 255, 255, 0) 100%), var(--color-surface)',
                border: '1px solid rgba(232, 98, 44, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Sparkles size={16} style={{ color: 'var(--color-accent)' }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                    Pyra Team Plan ($12 / seat / month)
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Unlock 1-minute ping cadences, up to 50 endpoints, webhook dispatch, and automated Slack notifications.
                </p>
              </div>
              <a
                href="/sign-up?plan=team"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', whiteSpace: 'nowrap' }}
              >
                <span>Upgrade to Team</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* ─── Section 3: Security & Cryptographic Compliance ───────────────── */}
        <div className="settings-section-row">
          <div className="settings-info-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={18} style={{ color: 'var(--color-success)' }} />
              <h5>Security & Compliance</h5>
            </div>
            <p>
              Active defense measures, zero-trust controls, and multi-tenant cryptographic safeguards protecting your workspace.
            </p>
          </div>

          <div className="settings-card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {[
                {
                  title: 'PostgreSQL Row-Level Security',
                  desc: 'Every SQL query executes within a scoped transaction setting app.current_tenant_id. Zero cross-tenant leaks.',
                  status: 'Active',
                  badge: 'Enforced',
                },
                {
                  title: 'AES-256-GCM Envelope Encryption',
                  desc: 'All target authorization headers and secrets are encrypted with authenticated cipher before disk persistence.',
                  status: 'Active',
                  badge: 'Encrypted',
                },
                {
                  title: 'Zero Public Database Tables',
                  desc: 'All tables require authenticated session context. Default public grants are explicitly revoked.',
                  status: 'Active',
                  badge: 'Protected',
                },
                {
                  title: 'Rate Limiting & Abuse Defense',
                  desc: 'Sliding-window rate limiting via Upstash Redis prevents brute-force attempts and denial-of-service vectors.',
                  status: 'Active',
                  badge: 'Protected',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: 'var(--tint-success-bg)', color: 'var(--color-success)', border: '1px solid var(--tint-success-border)' }}>
                        {item.badge}
                      </span>
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                      {item.title}
                    </span>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
