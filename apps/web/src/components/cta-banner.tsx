'use client'

import Link from 'next/link'
import { ArrowRight, Shield } from 'lucide-react'

export default function CtaBanner() {
  return (
    <section
      className="reveal"
      style={{
        maxWidth: 1120,
        margin: '0 auto',
        padding: '24px 24px 80px',
      }}
      aria-label="Call to action"
    >
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8F3ED 50%, #F5ECE3 100%)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-raised)',
          padding: '56px 36px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle accent warm background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-40%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 480,
            height: 240,
            background: 'radial-gradient(circle, rgba(232, 98, 44, 0.12) 0%, rgba(255, 255, 255, 0) 70%)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '4px 14px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-accent)',
              marginBottom: 20,
            }}
          >
            <Shield size={13} aria-hidden="true" />
            Zero Setup Fatigue · Free Forever
          </div>

          <h2 style={{ marginBottom: 16 }}>
            Never let a service go cold again.
          </h2>

          <p style={{ fontSize: 17, color: 'var(--color-text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
            Start monitoring in 60 seconds. Keep your free-tier containers, healthchecks, and scheduled jobs alive effortlessly.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/sign-up"
              className="btn btn-primary btn-lg"
              id="cta-signup-btn"
            >
              Get started for free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard"
              className="btn btn-secondary btn-lg"
            >
              View live demo
            </Link>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginTop: 20 }}>
            No credit card required · Free 3-target tier · Setup in 60 seconds
          </p>
        </div>
      </div>
    </section>
  )
}
