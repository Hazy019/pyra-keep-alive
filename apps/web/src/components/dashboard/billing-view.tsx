'use client'

import { useState } from 'react'
import {
  CreditCard,
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  Layers,
  Clock,
  Bell,
  Users,
  Download,
  ArrowRight,
  AlertCircle,
  FileText,
} from 'lucide-react'

interface BillingViewProps {
  workspaceName: string
  tenantId: string
  initialPlan: string
  targetCount: number
}

export default function BillingView({
  workspaceName,
  tenantId,
  initialPlan,
  targetCount,
}: BillingViewProps) {
  const [currentPlan, setCurrentPlan] = useState<'free' | 'team'>(
    initialPlan === 'team' ? 'team' : 'free',
  )
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const isTeam = currentPlan === 'team'
  const maxTargets = isTeam ? 50 : 3
  const quotaPercent = Math.min(100, Math.round((targetCount / maxTargets) * 100))

  async function handleSwitchPlan(newPlan: 'free' | 'team') {
    if (newPlan === currentPlan) return
    setLoading(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/billing/plan', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      })

      const data = (await res.json()) as { success?: boolean; message?: string; error?: string }

      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Failed to update workspace plan.',
        })
        return
      }

      setCurrentPlan(newPlan)
      setStatusMessage({
        type: 'success',
        text:
          newPlan === 'team'
            ? 'Workspace upgraded to Team Plan ($12/seat/month)! High-frequency 1m intervals and 50 target capacity are now active.'
            : 'Workspace reverted to Free Tier.',
      })

      // Refresh page context after a brief moment so all server components (layout, sidebar) pick up the change
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error communicating with the billing service.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, width: '100%' }}>
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h4 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Billing & Subscription</h4>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isTeam ? '#DF551F' : 'var(--color-text-dim)',
                background: isTeam ? 'rgba(232, 98, 44, 0.12)' : 'var(--color-surface-2)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                border: isTeam ? '1px solid rgba(232, 98, 44, 0.3)' : '1px solid var(--color-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {isTeam ? <Sparkles size={11} style={{ color: 'var(--color-accent)' }} /> : null}
              {isTeam ? 'Team Plan Active' : 'Free Tier'}
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, margin: 0 }}>
            Manage subscription plans, ping frequency limits, seat allocation, and billing history for{' '}
            <strong>{workspaceName}</strong>.
          </p>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            fontSize: 12.5,
            color: 'var(--color-text-muted)',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
          <span>RLS Isolated Tenant</span>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background:
              statusMessage.type === 'success'
                ? 'var(--tint-success-bg)'
                : 'rgba(178, 58, 46, 0.08)',
            border: `1px solid ${
              statusMessage.type === 'success'
                ? 'var(--tint-success-border)'
                : 'rgba(178, 58, 46, 0.25)'
            }`,
            color:
              statusMessage.type === 'success'
                ? 'var(--color-success)'
                : 'var(--color-error)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {statusMessage.type === 'success' ? (
            <Check size={16} style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ─── Active Quota & Plan Overview Card ──────────────────────────────── */}
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--color-text-dim)',
                display: 'block',
                marginBottom: 4,
              }}
            >
              Active Subscription
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text)' }}>
                {isTeam ? 'Team Plan' : 'Free Tier'}
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: isTeam ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}
              >
                {isTeam ? '$12 / seat / month' : '$0 / month'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="badge"
              style={{
                fontSize: 12,
                background: 'var(--tint-success-bg)',
                color: 'var(--color-success)',
                border: '1px solid var(--tint-success-border)',
                padding: '4px 10px',
              }}
            >
              ● Subscription Active
            </span>
          </div>
        </div>

        {/* Quota Progress Meter */}
        <div
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
              Monitored Endpoints Allocation
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              <strong>{targetCount}</strong> of <strong>{maxTargets}</strong> endpoints used (
              {quotaPercent}%)
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: 8,
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${quotaPercent}%`,
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background:
                  quotaPercent > 85 ? 'var(--color-accent)' : 'var(--color-success)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginTop: 16,
              paddingTop: 12,
              borderTop: '1px solid var(--color-border)',
              fontSize: 12.5,
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} style={{ color: 'var(--color-accent)' }} />
              <span>
                Minimum interval:{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {isTeam ? '1 minute (Verified)' : '5 minutes'}
                </strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={15} style={{ color: 'var(--color-accent)' }} />
              <span>
                Telemetry retention:{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {isTeam ? '90 days' : '30 days'}
                </strong>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={15} style={{ color: 'var(--color-accent)' }} />
              <span>
                Alerting:{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {isTeam ? 'Slack, Discord & Webhooks' : 'Email only'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Plan Cards (Matching Image 2 Spec) ────────────────────────────── */}
      <div>
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Choose Plan & Ping Tier</h5>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            Scale ping frequency and concurrency up or down instantly. All plan upgrades apply in real-time.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          {/* Card 1: Free Tier */}
          <div
            className="card"
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: !isTeam ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
              background: !isTeam ? 'var(--color-surface)' : 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              boxShadow: !isTeam ? 'var(--shadow-raised)' : 'var(--shadow-resting)',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-text-dim)',
                  }}
                >
                  FREE
                </span>
                {!isTeam && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-secondary)',
                      background: 'var(--color-surface-2)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    Current Plan
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-text)' }}>$0</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>/ month</span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                For personal hobby projects, hackathon prototypes, and basic container keep-alives.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 16,
                  marginBottom: 24,
                }}
              >
                {[
                  'Up to 3 targets per workspace',
                  'Ping every 5 minutes (prevents sleep)',
                  'SSL certificate health monitoring',
                  'Standard HTTP/HTTPS status verification',
                  '30-day ping & audit history',
                  'Email notification alerts',
                ].map((feat) => (
                  <div
                    key={feat}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                  >
                    <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <span style={{ color: 'var(--color-text)' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSwitchPlan('free')}
              disabled={loading || !isTeam}
              className={`btn w-full ${!isTeam ? 'btn-ghost' : 'btn-secondary'}`}
              style={{ padding: '11px 0', fontSize: 13.5, fontWeight: 600 }}
            >
              {!isTeam ? 'Active Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Card 2: Team Tier (Image 2) */}
          <div
            className="card"
            style={{
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: isTeam
                ? '2px solid var(--color-accent)'
                : '1px solid rgba(232, 98, 44, 0.4)',
              background: 'linear-gradient(180deg, rgba(232, 98, 44, 0.04) 0%, var(--color-surface) 100%)',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {/* "MOST POPULAR" Ribbon matching Image 2 */}
            <div
              style={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'var(--color-accent)',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 14px',
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 2px 8px rgba(232, 98, 44, 0.4)',
              }}
            >
              MOST POPULAR
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                  marginTop: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--color-accent)',
                  }}
                >
                  TEAM
                </span>
                {isTeam && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      background: 'rgba(232, 98, 44, 0.12)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      border: '1px solid rgba(232, 98, 44, 0.3)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Sparkles size={11} />
                    Current Plan
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--color-text)' }}>$12</span>
                <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                  / per seat / month
                </span>
              </div>

              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                For teams needing high-frequency pings and shared workspaces.
              </p>

              {/* Feature Checklist matching Image 2 verbatim */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 16,
                  marginBottom: 24,
                }}
              >
                {[
                  'Up to 50 targets per workspace',
                  'Ping every 60 seconds (verified)',
                  'Slack, Discord, and custom webhooks',
                  'Team RBAC & workspace isolation',
                  '90-day ping & audit history',
                  'Priority routing & SLAs',
                ].map((feat) => (
                  <div
                    key={feat}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: 'rgba(40, 167, 69, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={12} style={{ color: 'var(--color-success)' }} />
                    </div>
                    <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSwitchPlan('team')}
              disabled={loading || isTeam}
              className={`btn w-full ${isTeam ? 'btn-ghost' : 'btn-primary'}`}
              style={{
                padding: '11px 0',
                fontSize: 13.5,
                fontWeight: 700,
                background: isTeam ? 'var(--color-surface-2)' : 'var(--color-accent)',
                color: isTeam ? 'var(--color-text)' : '#FFFFFF',
              }}
            >
              {isTeam ? '✓ Active Plan' : loading ? 'Activating…' : 'Upgrade to Team ($12/mo)'}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Payment Details & Invoicing ────────────────────────────────────── */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <CreditCard size={18} style={{ color: 'var(--color-accent)' }} />
          <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Payment Method & Invoicing</h5>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-text-dim)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Default Payment Method
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 24,
                  borderRadius: 4,
                  background: '#2B2B2B',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                VISA
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  •••• •••• •••• 4242
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Expires 08/28</div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--color-text-dim)',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Billing Cadence
            </span>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              Monthly Subscription
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Next renewal: <strong>October 27, 2026</strong>
            </div>
          </div>
        </div>

        {/* Invoice Table */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text)',
              display: 'block',
              marginBottom: 12,
            }}
          >
            Recent Invoices
          </span>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-dim)', textAlign: 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '8px 12px' }}>Invoice</th>
                  <th style={{ padding: '8px 12px' }}>Billing Date</th>
                  <th style={{ padding: '8px 12px' }}>Amount</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                    INV-2026-0927
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-muted)' }}>
                    Sep 27, 2026
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text)' }}>
                    $12.00
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-success)',
                        background: 'var(--tint-success-bg)',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      Paid
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => alert('Receipt INV-2026-0927 downloaded.')}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Download size={13} /> PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
