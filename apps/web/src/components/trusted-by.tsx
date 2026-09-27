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
  { value: 8450, suffix: '+', label: 'Monitored endpoints' },
  { value: 42, prefix: '< ', suffix: 'ms', label: 'Global edge latency' },
]

const PARTNERS = [
  'Render', 'Railway', 'Fly.io', 'Supabase', 'Neon', 'Vercel',
  'Cloudflare', 'Heroku', 'PlanetScale', 'Upstash',
]

// Duplicate for seamless infinite marquee loop
const MARQUEE_ITEMS = [...PARTNERS, ...PARTNERS]

export default function TrustedBy() {
  return (
    <section
      aria-label="Platform telemetry and supported hosting providers"
      style={{ width: '100%', padding: '0 0 24px' }}
    >
      {/* ─── Metric counters bridging hero boundary ─────────────────────── */}
      <div className="stats-card-wrapper">
        <div className="stats-card">
          <div className="stats-grid-track">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="stats-grid-item"
              >
                <div
                  className="stat-number stats-number"
                  data-value={stat.value}
                  data-prefix={stat.prefix ?? ''}
                  data-suffix={stat.suffix ?? ''}
                  data-decimals={stat.decimals ?? 0}
                >
                  {stat.prefix ?? ''}0{stat.suffix ?? ''}
                </div>
                <div className="stats-label">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Auto-scrolling partner marquee ─────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-text-dim)',
          }}
        >
          Reliably keeping services awake across modern clouds
        </p>
      </div>

      <div className="marquee-wrapper">
        <div className="marquee-track">
          {MARQUEE_ITEMS.map((partner, i) => (
            <div
              key={`${partner}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 32px',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Accent dot */}
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  opacity: 0.4,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-text-muted)',
                }}
              >
                {partner}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
