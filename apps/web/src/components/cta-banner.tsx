'use client'

import Link from 'next/link'
import { ArrowRight, Shield, Zap, Lock } from 'lucide-react'

export default function CtaBanner() {
  return (
    <section
      className="reveal"
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '16px 20px 64px',
      }}
      aria-label="Call to action"
    >
      <div
        className="cta-dark"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '64px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated background orbs */}
        <div className="cta-orb cta-orb-1" aria-hidden="true" />
        <div className="cta-orb cta-orb-2" aria-hidden="true" />

        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        {/* Top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--color-accent), rgba(232,98,44,0.4), transparent)',
          }}
          aria-hidden="true"
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 620, margin: '0 auto' }}>
          {/* Eyebrow badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(232, 98, 44, 0.15)',
              border: '1px solid rgba(232, 98, 44, 0.3)',
              padding: '5px 16px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              color: '#F5A87A',
              marginBottom: 24,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <Shield size={13} aria-hidden="true" />
            Zero Setup Fatigue · Free Forever
          </div>

          <h2 style={{ marginBottom: 16, fontSize: 'clamp(1.9rem, 4vw, 2.6rem)' }}>
            Never let a service go cold again.
          </h2>

          <p style={{ fontSize: 17, marginBottom: 36, lineHeight: 1.65 }}>
            Start monitoring in 60 seconds. Keep your free-tier containers,
            healthchecks, and scheduled jobs alive — effortlessly.
          </p>

          {/* Feature micro-list */}
          <div
            style={{
              display: 'flex',
              gap: 24,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 36,
            }}
          >
            {[
              { icon: Zap, label: '60s setup' },
              { icon: Lock, label: 'AES-256 encrypted' },
              { icon: Shield, label: 'Free forever tier' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'rgba(245,240,235,0.65)',
                }}
              >
                <Icon size={15} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                {label}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/sign-up"
              className="btn btn-primary btn-lg btn-magnetic"
              id="cta-signup-btn"
              style={{
                background: 'var(--color-accent)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(232,98,44,0.45)',
              }}
            >
              Get started for free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-lg"
              style={{
                background: 'rgba(255,255,255,0.08)',
                color: 'var(--color-text-on-dark)',
                border: '1px solid rgba(255,255,255,0.14)',
                backdropFilter: 'blur(8px)',
              }}
            >
              View live demo
            </Link>
          </div>

          <p style={{ fontSize: 13, marginTop: 20, color: 'rgba(245,240,235,0.4)' }}>
            No credit card required · Free 3-target tier · Setup in 60 seconds
          </p>
        </div>
      </div>
    </section>
  )
}
