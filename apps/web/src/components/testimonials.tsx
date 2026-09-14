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
        maxWidth: 1120,
        margin: '0 auto',
        padding: '80px 24px',
        borderTop: '1px solid var(--color-border)',
      }}
      aria-label="Customer testimonials"
    >
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <p className="hero-eyebrow" style={{ display: 'inline-block', marginBottom: 12 }}>
          Trusted in production
        </p>
        <h2>What engineers are saying</h2>
        <p style={{ maxWidth: 540, margin: '12px auto 0', fontSize: 17 }}>
          Join thousands of developers keeping critical endpoints responsive 24/7.
        </p>
      </div>

      <div className="grid-3 stagger-group" style={{ gap: 24 }}>
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '28px 24px',
            }}
          >
            <blockquote
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'var(--color-text)',
                margin: 0,
                marginBottom: 24,
                fontStyle: 'normal',
              }}
            >
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Initials avatar with warm palette */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'var(--color-surface-2)',
                  border: `1.5px solid ${t.accentColor}`,
                  color: 'var(--color-text)',
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
    </section>
  )
}
