'use client'

interface StatItem {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  label: string
}

const STATS: StatItem[] = [
  { value: 14200000, suffix: '+', label: 'Uptime pings dispatched' },
  { value: 99.99, suffix: '%', decimals: 2, label: 'Historical uptime rate' },
  { value: 8450, suffix: '+', label: 'Monitored developer endpoints' },
  { value: 42, prefix: '< ', suffix: 'ms', label: 'Global edge check latency' },
]

const PARTNERS = [
  'Render',
  'Railway',
  'Fly.io',
  'Supabase',
  'Neon',
  'Vercel',
]

export default function TrustedBy() {
  return (
    <section
      aria-label="Platform telemetry and supported hosting providers"
      style={{
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '0 24px 72px',
      }}
    >
      {/* ─── Metric counters with GSAP count-up (bridging hero boundary) ─── */}
      <div
        className="card card-overlap"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-overlap)',
          padding: '28px 24px',
          marginTop: -36,
          position: 'relative',
          zIndex: 10,
          marginBottom: 40,
        }}
      >
        <div
          className="grid-4"
          style={{
            textAlign: 'center',
            gap: 24,
          }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                className="stat-number"
                data-value={stat.value}
                data-prefix={stat.prefix ?? ''}
                data-suffix={stat.suffix ?? ''}
                data-decimals={stat.decimals ?? 0}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(1.75rem, 2.5vw, 2.25rem)',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  lineHeight: 1.1,
                }}
              >
                {stat.prefix ?? ''}0{stat.suffix ?? ''}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Platform trust strip ───────────────────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-dim)',
            marginBottom: 18,
          }}
        >
          Reliably keeping services awake across modern clouds
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '28px 40px',
            opacity: 0.72,
          }}
        >
          {PARTNERS.map((partner) => (
            <div
              key={partner}
              style={{
                fontSize: 15,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--color-border)',
                }}
                aria-hidden="true"
              />
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
