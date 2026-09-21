'use client'

import { ShieldCheck, CheckCircle2, Zap, Lock } from 'lucide-react'

export default function ProductShowcase() {
  return (
    <section
      className="reveal"
      style={{
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--section-py-desktop) 0',
        position: 'relative',
      }}
      aria-label="Product preview"
    >
      <div className="section-inner">
      <div className="section-header">
        <p className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: 14 }}>
          Intuitive telemetry
        </p>
        <h2>Engineered for clarity and control</h2>
        <p>
          Monitor your serverless APIs, background workers, and hobby endpoints from a single uncluttered workspace.
        </p>
      </div>

      {/* ─── Product container with parallax & floating cards ─────────────── */}
      <div
        className="product-shot-container"
        style={{
          position: 'relative',
          padding: '16px 0',
        }}
      >
        {/* Floating Stat Card #1 (Top Right Overlay) */}
        <div
          className="floating-stat-card card"
          style={{
            position: 'absolute',
            top: -12,
            right: 20,
            zIndex: 10,
            background: 'var(--color-surface)',
            border: '1px solid rgba(232, 98, 44, 0.22)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-raised)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 270,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(76, 122, 70, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-success)',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={20} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              100% Operational
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Zero cold starts detected
            </div>
          </div>
        </div>

        {/* Browser Chrome Frame */}
        <div
          className="product-shot card"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-raised)',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {/* Chrome Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 18px',
              background: 'var(--color-surface-2)',
              borderBottom: '1px solid var(--color-border)',
              gap: 16,
            }}
          >
            {/* Window control dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#E2938B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ECC687' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#97C898' }} />
            </div>

            {/* URL bar */}
            <div
              style={{
                flex: 1,
                maxWidth: 420,
                margin: '0 auto',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Lock size={11} aria-hidden="true" style={{ color: 'var(--color-success)' }} />
              <span>https://app.pyra.dev/dashboard</span>
            </div>
          </div>

          {/* Dashboard Canvas Preview */}
          <div style={{ padding: '28px 32px', background: 'var(--color-bg)' }}>
            {/* Dashboard Subheader */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <h4 style={{ margin: 0, fontSize: 18 }}>System Overview</h4>
                <p style={{ fontSize: 13, margin: 0, color: 'var(--color-text-muted)' }}>
                  Workspace: Acme Production (Free Plan)
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-dot up" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-success)' }}>
                  All systems operational
                </span>
              </div>
            </div>

            {/* Metric Cards Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 14,
                marginBottom: 22,
              }}
            >
              {[
                { label: 'Total Endpoints', val: '8' },
                { label: 'Endpoints Up', val: '8', color: 'var(--color-success)' },
                { label: 'Uptime (30d)', val: '99.98%' },
                { label: 'Avg Latency', val: '42ms' },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 20,
                      fontWeight: 700,
                      color: m.color ?? 'var(--color-text)',
                      marginTop: 2,
                    }}
                  >
                    {m.val}
                  </div>
                </div>
              ))}
            </div>

            {/* Monitored targets table mock */}
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                  padding: '10px 16px',
                  background: 'var(--color-surface-2)',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>Endpoint URL</div>
                <div>Status</div>
                <div>Schedule</div>
                <div>Last Check</div>
              </div>

              {[
                { url: 'https://api.acme.co/v1/health', status: '200 OK', freq: '1m', time: '12s ago' },
                { url: 'https://cron-worker.fly.dev/heartbeat', status: '200 OK', freq: '5m', time: '1m ago' },
                { url: 'https://staging.onrender.com/ping', status: '200 OK', freq: '15m', time: '4m ago' },
              ].map((row, i) => (
                <div
                  key={row.url}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    padding: '12px 16px',
                    fontSize: 13,
                    alignItems: 'center',
                    borderBottom: i < 2 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={13} style={{ color: 'var(--color-accent)' }} />
                    <span className="truncate">{row.url}</span>
                  </div>
                  <div>
                    <span className="badge badge-up" style={{ fontSize: 11 }}>
                      {row.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)' }}>Every {row.freq}</div>
                  <div style={{ color: 'var(--color-text-dim)', fontSize: 12 }}>{row.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating Stat Card #2 (Bottom Left Overlay) */}
        <div
          className="floating-stat-card card"
          style={{
            position: 'absolute',
            bottom: -16,
            left: 24,
            zIndex: 10,
            background: 'var(--color-surface)',
            border: '1px solid rgba(232, 98, 44, 0.22)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-raised)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 290,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={20} aria-hidden="true" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
              Envelope Encryption Active
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              AES-256-GCM authenticated pings
            </div>
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}
