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
  ScrollText,
  History,
} from 'lucide-react'

export interface AuditLogItem {
  id: string
  action: string
  targetResource: string | null
  createdAt: Date
  rowHash: string
}

export interface SecurityCheckItem {
  id: string
  title: string
  detail: string
  status: 'enforced' | 'warning' | 'active'
  statusLabel: string
  verifiedAt: string
}

interface SettingsViewProps {
  workspaceName: string
  tenantId: string
  plan: string
  targetCount: number
  recentAuditLogs?: AuditLogItem[]
  securityChecks?: SecurityCheckItem[]
}

export default function SettingsView({
  workspaceName,
  tenantId,
  plan,
  targetCount,
  recentAuditLogs = [],
  securityChecks = [],
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
                <span>Ping interval: <strong>{plan === 'team' ? '1 minute (Verified)' : '5 minutes'}</strong></span>
                <span>History retention: <strong>{plan === 'team' ? '90 days' : '30 days'}</strong></span>
                <span>Alerting: <strong>{plan === 'team' ? 'Slack, Discord & Webhooks' : 'Email'}</strong></span>
              </div>
            </div>

            {/* Upgrade / Manage Subscription Banner */}
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
                    {plan === 'team'
                      ? 'Pyra Team Plan ($12 / seat / month)'
                      : 'Upgrade to Pyra Team ($12 / seat / month)'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {plan === 'team'
                    ? '1-minute ping cadences, 50 endpoints, webhook dispatch, and direct worker scheduling are currently unlocked.'
                    : 'Unlock 1-minute ping cadences, up to 50 endpoints, webhook dispatch, and automated Slack notifications.'}
                </p>
              </div>
              <a
                href="/dashboard/billing"
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', whiteSpace: 'nowrap' }}
              >
                <span>{plan === 'team' ? 'Manage Subscription' : 'Upgrade to Team'}</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* ─── Section 3: Security & Cryptographic Controls (Visible Checklist) ── */}
        <div className="settings-section-row">
          <div className="settings-info-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Shield size={18} style={{ color: 'var(--color-success)' }} />
              <h5>Security & Architecture</h5>
            </div>
            <p>
              Concrete security controls enforced directly in code and database infrastructure. Verified in real time against active configuration.
            </p>
          </div>

          <div className="settings-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {securityChecks.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.status === 'warning' ? 'var(--color-error)' : 'var(--color-success)',
                        boxShadow: item.status === 'warning' ? '0 0 8px rgba(186, 26, 26, 0.6)' : '0 0 8px rgba(76, 122, 70, 0.6)',
                        marginTop: 6,
                        flexShrink: 0,
                      }}
                      aria-label={item.statusLabel}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' }}>
                          {item.title}
                        </span>
                      </div>
                      <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`badge ${item.status === 'warning' ? 'badge-down' : 'badge-up'}`}
                    style={{ fontSize: 11, padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}
                  >
                    {item.statusLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Section 4: Activity & Tamper-Evident Audit Trail ──────────────── */}
        <div className="settings-section-row">
          <div className="settings-info-col">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <History size={18} style={{ color: 'var(--color-accent)' }} />
              <h5>Activity & Audit Trail</h5>
            </div>
            <p>
              Real-time ledger of administrative operations and target mutations in this workspace with cryptographic row verification.
            </p>
          </div>

          <div className="settings-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                Recent Workspace Events
              </span>
              <a
                href="/dashboard/activity"
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 10px' }}
              >
                <span>Open Full Activity Ledger</span>
                <ArrowRight size={12} />
              </a>
            </div>
            {recentAuditLogs.length === 0 ? (
              <div
                style={{
                  padding: '28px 20px',
                  textAlign: 'center',
                  background: 'var(--color-surface-2)',
                  border: '1px dashed var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px auto',
                    color: 'var(--color-accent)',
                  }}
                >
                  <ScrollText size={20} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 4 }}>
                  Audit Ledger Initialized
                </span>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-muted)', maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
                  Every endpoint registration, credential update, and interval change in this workspace is permanently signed and hash-chained to guarantee integrity.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {recentAuditLogs.map((log) => {
                  const dateStr = new Date(log.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return (
                    <div
                      key={log.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 12,
                        padding: '12px 16px',
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 600,
                            padding: '3px 8px',
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-accent)',
                          }}
                        >
                          {log.action}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>
                          {log.targetResource || 'Workspace Entity'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono, monospace)',
                            color: 'var(--color-text-dim)',
                            background: 'var(--color-surface)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                          }}
                          title={`SHA-256 Row Hash: ${log.rowHash}`}
                        >
                          hash:{log.rowHash.slice(0, 8)}…
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
