'use client'

import { Shield, Zap, Globe } from 'lucide-react'

const PARTNERS = [
  'Render',
  'Railway',
  'Fly.io',
  'Supabase',
  'Neon',
  'Vercel',
  'Cloudflare',
  'Heroku',
  'PlanetScale',
  'Upstash',
]

export default function TrustedBy() {
  return (
    <section
      aria-label="Supported hosting providers and infrastructure"
      style={{ width: '100%', padding: '0 0 24px' }}
    >
      {/* ─── Transparent Platform Status Callout ──────────────────────────── */}
      <div className="stats-card-wrapper">
        <div className="stats-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
              padding: '16px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(232, 98, 44, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-accent)',
                }}
              >
                <Zap size={16} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  Launched 2026
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                  Free while we grow
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(76, 122, 70, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-success)',
                }}
              >
                <Shield size={16} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  AES-256 Envelope Encryption
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                  Encrypted at rest, decrypted only in worker
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'rgba(181, 106, 21, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-warning)',
                }}
              >
                <Globe size={16} aria-hidden="true" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  Singapore Region (sin)
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                  Single-region worker today · More regions planned
                </div>
              </div>
            </div>
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
          Works with modern cloud platforms
        </p>
      </div>

      <div className="marquee-wrapper">
        <div className="marquee-track">
          {PARTNERS.map((partner, i) => (
            <div
              key={`p1-${partner}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 32px',
                whiteSpace: 'nowrap',
              }}
            >
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

          {/* Duplicated track strictly for continuous CSS animation, aria-hidden for screen readers */}
          {PARTNERS.map((partner, i) => (
            <div
              key={`p2-${partner}-${i}`}
              aria-hidden="true"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 32px',
                whiteSpace: 'nowrap',
              }}
            >
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
