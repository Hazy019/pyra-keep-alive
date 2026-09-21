'use client'

interface Testimonial {
  quote: string
  name: string
  role: string
  company: string
  initials: string
  accentColor: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'We run several serverless microservices on Render and Railway that used to suffer cold starts or sleep unexpectedly. Pyra eliminated 100% of our wake-up lag with zero setup friction.',
    name: 'Elena Rostova',
    role: 'Lead Infrastructure Engineer',
    company: 'Veloce Data',
    initials: 'ER',
    accentColor: '#E8622C',
  },
  {
    quote:
      'The encrypted auth headers were what sold us. Our protected staging webhooks can be kept warm safely without exposing internal API tokens in logs.',
    name: 'Marcus Chen',
    role: 'Staff Backend Architect',
    company: 'HyperFlow Studio',
    initials: 'MC',
    accentColor: '#4C7A46',
  },
  {
    quote:
      'Cleanest uptime tool I have used. Three steps to configure, zero false alarms, and the tamper-evident audit trail gave our compliance team peace of mind.',
    name: 'Sarah Lindqvist',
    role: 'Founder & CTO',
    company: 'Northward Labs',
    initials: 'SL',
    accentColor: '#C97B6B',
  },
]

export default function Testimonials() {
  return (
    <section
      className="reveal"
      style={{
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface-alt)',
        padding: 'var(--section-py-desktop) 0',
      }}
      aria-label="Customer testimonials"
    >
      <div className="section-inner">
      <div className="section-header">
        <p className="hero-eyebrow" style={{ display: 'inline-flex', marginBottom: 14 }}>
          Trusted in production
        </p>
        <h2>What engineers are saying</h2>
        <p>
          Join thousands of developers keeping critical endpoints responsive 24/7.
        </p>
      </div>

      <div className="grid-3 stagger-group" style={{ gap: 16 }}>
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="card tilt-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle top accent */}
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${t.accentColor}50, transparent)`,
              }}
              aria-hidden="true"
            />

            {/* Quote mark */}
            <div
              style={{
                fontSize: 56,
                fontFamily: 'var(--font-heading)',
                color: `${t.accentColor}20`,
                lineHeight: 1,
                marginBottom: -8,
                marginTop: -4,
                userSelect: 'none',
              }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            <blockquote
              style={{
                fontSize: 14,
                lineHeight: 1.72,
                color: 'var(--color-text)',
                margin: 0,
                marginBottom: 20,
                fontStyle: 'normal',
              }}
            >
              {t.quote}
            </blockquote>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `${t.accentColor}14`,
                  border: `1.5px solid ${t.accentColor}40`,
                  color: t.accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-heading)',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {t.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {t.role} · {t.company}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </section>
  )
}
