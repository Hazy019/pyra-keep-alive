import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Zap,
  Lock,
  Bell,
  Users,
  FileCheck2,
  ShieldCheck,
  Check,
  ExternalLink,
  ArrowRight,
  Activity,
  Globe,
} from 'lucide-react'
import HeartbeatHero from '@/components/heartbeat-hero'
import MobileNav from '@/components/mobile-nav'
import TrustedBy from '@/components/trusted-by'
import ProductShowcase from '@/components/product-showcase'
import Testimonials from '@/components/testimonials'
import CtaBanner from '@/components/cta-banner'
import GSAPProvider from '@/components/gsap-provider'
import PyraLogo from '@/components/pyra-logo'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'Pyra — Keep-Alive & Uptime Service',
  description:
    'Pyra pings your HTTP endpoints on a schedule so they never pause, sleep, or get forgotten. Free for solo builders.',
}

const features = [
  {
    icon: Zap,
    title: 'Intervals down to 1 minute',
    description:
      'Verified targets on the team plan can be pinged every 60 seconds. Free tier: hourly for verified endpoints.',
    color: '#E8622C',
  },
  {
    icon: Lock,
    title: 'Auth-header pings',
    description:
      'Store an Authorization header — it is AES-256-GCM envelope-encrypted at rest and never written to raw logs.',
    color: '#4C7A46',
  },
  {
    icon: Bell,
    title: 'Actionable failure alerts',
    description:
      'Instant email notifications with configurable alert cooldowns so your inbox is never flooded during transient blips.',
    color: '#B56A15',
  },
  {
    icon: Users,
    title: 'Shared team workspaces',
    description:
      'Invite collaborators with granular RBAC (viewer, member, admin, owner), shared endpoints, and unified billing.',
    color: '#C97B6B',
  },
  {
    icon: FileCheck2,
    title: 'Tamper-evident audit trail',
    description:
      'Every mutation is recorded in a cryptographically hash-chained audit log to detect any historical tampering.',
    color: '#E8622C',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-tenant database isolation',
    description:
      'Row-Level Security on Postgres ensures your target data and logs remain strictly invisible to other organizations.',
    color: '#4C7A46',
  },
]

const steps = [
  {
    step: '01',
    title: 'Register your endpoint',
    desc: 'Paste your target URL. Add an optional Bearer token or verify domain ownership to unlock high-frequency checks.',
    icon: Globe,
  },
  {
    step: '02',
    title: 'Set your schedule',
    desc: 'Choose a ping cadence. Free plan offers hourly and daily pings; team plan enables 1-minute intervals.',
    icon: Activity,
  },
  {
    step: '03',
    title: 'Pyra handles the rest',
    desc: 'Our distributed edge workers execute scheduled keep-alive requests, log response latencies, and alert on failures.',
    icon: Zap,
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For solo developers keeping personal projects alive.',
    features: [
      'Up to 3 monitored targets',
      'Hourly pings (verified endpoints)',
      'Daily pings (unverified endpoints)',
      'Email failure notifications',
      '30-day ping latency history',
    ],
    cta: 'Start for free',
    href: '/sign-up',
    highlight: false,
  },
  {
    name: 'Team',
    price: '$12',
    period: 'per seat / month',
    description: 'For teams needing high-frequency pings and shared workspaces.',
    features: [
      'Up to 50 targets per workspace',
      'Ping every 60 seconds (verified)',
      'Slack, Discord, and custom webhooks',
      'Team RBAC & workspace isolation',
      '90-day ping & audit history',
      'Priority routing & SLAs',
    ],
    cta: 'Start free trial',
    href: '/sign-up?plan=team',
    highlight: true,
  },
]

export default function HomePage() {
  return (
    <GSAPProvider>
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

        {/* ─── Navigation ─────────────────────────────────────────────── */}
        <header className="marketing-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              id="header-logo"
            >
              <PyraLogo size={28} />
            </Link>

            <nav
              style={{ display: 'flex', gap: 24 }}
              className="hidden md:flex"
              aria-label="Main navigation"
            >
              <a href="#features" className="link-underline" style={{ fontSize: 14 }}>Features</a>
              <a href="#how-it-works" className="link-underline" style={{ fontSize: 14 }}>How it works</a>
              <a href="#pricing" className="link-underline" style={{ fontSize: 14 }}>Pricing</a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
                style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                aria-label="Documentation (opens in a new tab)"
              >
                Docs
                <ExternalLink size={11} aria-hidden="true" style={{ color: 'var(--color-text-muted)' }} />
              </a>
            </nav>
          </div>

          <div className="hidden md:flex" style={{ gap: 10, alignItems: 'center' }}>
            <SignedOut>
              <Link href="/sign-in" className="btn btn-ghost btn-sm" id="header-signin-btn">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn btn-primary btn-sm btn-magnetic" id="header-signup-btn">
                Get started free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn btn-ghost btn-sm" id="header-dashboard-btn">
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: { width: 32, height: 32 } },
                }}
              />
            </SignedIn>
          </div>

          <MobileNav />
        </header>

        {/* ─── Hero ───────────────────────────────────────────────────── */}
        <div className="hero-outer">
          {/* Decorative background layers */}
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-bg-grid" />
            <div className="hero-bg-orb-1" />
            <div className="hero-bg-orb-2" />
          </div>

          <section className="hero-section" aria-labelledby="hero-title">
            {/* Left: Value prop */}
            <div className="hero-content">
              <div className="hero-eyebrow">
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-success)',
                    boxShadow: '0 0 0 3px rgba(76, 122, 70, 0.2)',
                    animation: 'pulse-green 2s ease-in-out infinite',
                  }}
                  aria-hidden="true"
                />
                <span>High-Availability Keep-Alive</span>
                <span style={{ color: 'var(--color-border)', margin: '0 2px' }}>/</span>
                <span className="hero-eyebrow-accent">Global Edge Pingers</span>
              </div>

              <h1 id="hero-title" className="hero-headline">
                Your services{' '}
                <span style={{ color: 'var(--color-accent)', fontStyle: 'italic' }}>
                  stay awake.
                </span>
                <br />
                Automatically.
              </h1>

              <p className="hero-subhead">
                Register an endpoint. Pyra pings it on schedule.
                No sleep mode, no cold start latencies, no forgotten background cron jobs.
              </p>

              <div className="hero-cta-group">
                <Link href="/sign-up" className="btn btn-primary btn-lg btn-magnetic" id="hero-signup-btn">
                  Start for free
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="#how-it-works" className="btn btn-secondary btn-lg">
                  See how it works
                </a>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <p style={{ fontSize: 12.5, color: 'var(--color-text-dim)', margin: 0 }}>
                  Free forever tier · No credit card required · Instant activation
                </p>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Lock size={12} style={{ color: 'var(--color-accent)' }} aria-hidden="true" />
                  Your credentials are encrypted before they&apos;re stored — we can&apos;t read them, and neither can anyone else.
                </p>
              </div>
            </div>

            {/* Right: Layered telemetry card */}
            <div className="hero-card">
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 2 }}>
                    Active telemetry
                  </p>
                  <p style={{ fontSize: 17, fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-text)' }}>
                    Live Signal Monitor
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--tint-success-bg)', border: '1px solid var(--tint-success-border)', padding: '3px 10px', borderRadius: 100 }}>
                  <span className="status-dot up" style={{ width: 6, height: 6 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-success)' }}>Operational</span>
                </div>
              </div>

              <HeartbeatHero />

              {/* Bottom meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Ping Interval: <strong style={{ color: 'var(--color-text)' }}>60s</strong>
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Avg Edge RTT: <strong style={{ color: 'var(--color-accent)' }}>18ms</strong>
                </span>
              </div>

              {/* Three mini stat pills */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { label: '99.99%', sub: 'Uptime' },
                  { label: '14.2M', sub: 'Pings sent' },
                  { label: '8,450', sub: 'Endpoints' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      flex: 1,
                      background: 'var(--color-surface-2)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      textAlign: 'center',
                      minWidth: 70,
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-dim)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* ─── Trusted-by & Marquee ────────────────────────────────────── */}
        <TrustedBy />

        {/* ─── Product Showcase ────────────────────────────────────────── */}
        <ProductShowcase />

        {/* ─── Features Grid ───────────────────────────────────────────── */}
        <section
          id="features"
          className="reveal features-section-bg"
          style={{
            padding: 'clamp(48px, 6vw, 80px) 0',
            borderTop: '1px solid var(--color-border)',
          }}
          aria-labelledby="features-title"
        >
          <div className="section-inner">
            <div className="section-header">
              <h2 id="features-title">Everything required to stay live</h2>
              <p>
                Built specifically for modern serverless apps, background workers, and production APIs.
              </p>
            </div>

            <div className="grid-2 stagger-group" style={{ gap: 16 }}>
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <div
                    key={f.title}
                    className="card tilt-card"
                    style={{
                      display: 'flex',
                      gap: 16,
                      padding: '24px',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      className="tilt-inner"
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        background: `${f.color}18`,
                        border: `1px solid ${f.color}28`,
                        color: f.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={22} aria-hidden="true" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', marginBottom: 6, fontWeight: 600 }}>
                        {f.title}
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.65, margin: 0 }}>
                        {f.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── How it works ────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="reveal"
          style={{
            padding: 'clamp(48px, 6vw, 80px) 0',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
          }}
          aria-labelledby="how-it-works-title"
        >
          <div className="section-inner">
            <div className="section-header">
              <h2 id="how-it-works-title">Three steps. Then forget about it.</h2>
              <p>Get endpoints scheduled and protected in less than two minutes.</p>
            </div>

            {/* Steps with connector line */}
            <div className="steps-grid stagger-group">
              {steps.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.step} className="step-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="step-number">{item.step}</div>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </div>
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: 8, fontWeight: 600 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.65, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─────────────────────────────────────────────── */}
        <Testimonials />

        {/* ─── Pricing ──────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="reveal"
          style={{
            padding: 'clamp(48px, 6vw, 80px) 0',
            borderTop: '1px solid var(--color-border)',
            position: 'relative',
            overflow: 'hidden',
          }}
          aria-labelledby="pricing-title"
        >
          {/* Background accent orb */}
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              right: '-5%',
              width: 500,
              height: 500,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(232,98,44,0.06) 0%, transparent 65%)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          />

          <div className="section-inner" style={{ position: 'relative' }}>
            <div className="section-header">
              <h2 id="pricing-title">Simple, predictable plans</h2>
              <p>
                Start free forever. Upgrade when your team grows or latency requirements tighten.
              </p>
            </div>

            <div className="grid-2 stagger-group" style={{ gap: 20, alignItems: 'start', maxWidth: 860, margin: '0 auto' }}>
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`card${plan.highlight ? ' pricing-highlight' : ''}`}
                  style={{
                    border: plan.highlight
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    position: 'relative',
                    padding: '28px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: plan.highlight ? 'var(--shadow-glow)' : 'var(--shadow-resting)',
                    background: plan.highlight
                      ? 'linear-gradient(160deg, #fff 60%, rgba(232,98,44,0.04) 100%)'
                      : 'var(--color-surface)',
                  }}
                >
                  {plan.highlight && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--color-accent)',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        padding: '4px 16px',
                        borderRadius: 100,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        {plan.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 48, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.03em' }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        / {plan.period}
                      </span>
                    </div>

                    <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24, minHeight: 36 }}>
                      {plan.description}
                    </p>

                    <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: 20 }} />

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 32, padding: 0 }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--color-text)' }}>
                          <span
                            style={{
                              color: 'var(--color-success)',
                              background: 'rgba(76, 122, 70, 0.1)',
                              borderRadius: '50%',
                              width: 20,
                              height: 20,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: 1,
                            }}
                          >
                            <Check size={12} aria-hidden="true" />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={plan.href}
                    className={`btn w-full btn-magnetic ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    style={{ padding: '13px 20px', fontSize: 15 }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ──────────────────────────────────────────────── */}
        <CtaBanner />

        {/* ─── Footer ──────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: '32px 20px',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
              id="footer-logo"
            >
              <PyraLogo size={24} />
            </Link>

            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/privacy" className="link-underline" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Privacy</Link>
              <Link href="/terms" className="link-underline" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Terms</Link>
              <a href="mailto:hello@pyra.dev" className="link-underline" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Contact</a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
                style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                aria-label="GitHub Repository (opens in a new tab)"
              >
                GitHub
                <ExternalLink size={11} aria-hidden="true" />
              </a>
            </div>

            <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
              © {new Date().getFullYear()} Pyra Inc. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </GSAPProvider>
  )
}
