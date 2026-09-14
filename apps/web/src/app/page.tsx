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
} from 'lucide-react'
import HeartbeatHero from '@/components/heartbeat-hero'
import MobileNav from '@/components/mobile-nav'
import TrustedBy from '@/components/trusted-by'
import ProductShowcase from '@/components/product-showcase'
import Testimonials from '@/components/testimonials'
import CtaBanner from '@/components/cta-banner'
import GSAPProvider from '@/components/gsap-provider'
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
  },
  {
    icon: Lock,
    title: 'Auth-header pings',
    description:
      'Store an Authorization header — it is AES-256-GCM envelope-encrypted at rest and never written to raw logs.',
  },
  {
    icon: Bell,
    title: 'Actionable failure alerts',
    description:
      'Instant email notifications with configurable alert cooldowns so your inbox is never flooded during transient blips.',
  },
  {
    icon: Users,
    title: 'Shared team workspaces',
    description:
      'Invite collaborators with granular RBAC (viewer, member, admin, owner), shared endpoints, and unified billing.',
  },
  {
    icon: FileCheck2,
    title: 'Tamper-evident audit trail',
    description:
      'Every mutation is recorded in a cryptographically hash-chained audit log to detect any historical tampering.',
  },
  {
    icon: ShieldCheck,
    title: 'Multi-tenant database isolation',
    description:
      'Row-Level Security on Postgres ensures your target data and logs remain strictly invisible to other organizations.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Register your endpoint',
    desc: 'Paste your target URL. Add an optional Bearer token or verify domain ownership to unlock high-frequency checks.',
  },
  {
    step: '02',
    title: 'Set your schedule',
    desc: 'Choose a ping cadence. Free plan offers hourly and daily pings; team plan enables 1-minute intervals.',
  },
  {
    step: '03',
    title: 'Pyra handles the rest',
    desc: 'Our distributed edge workers execute scheduled keep-alive requests, log response latencies, and alert on failures.',
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
        {/* ─── Navigation ───────────────────────────────────────────────────── */}
        <header className="marketing-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-text)',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
              }}
              id="header-logo"
            >
              Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
            </Link>

            <nav
              style={{ display: 'flex', gap: 28 }}
              className="hidden md:flex"
              aria-label="Main navigation"
            >
              <a href="#features" className="link-underline" style={{ fontSize: 14 }}>
                Features
              </a>
              <a href="#how-it-works" className="link-underline" style={{ fontSize: 14 }}>
                How it works
              </a>
              <a href="#pricing" className="link-underline" style={{ fontSize: 14 }}>
                Pricing
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
                style={{ fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                aria-label="Documentation (opens in a new tab)"
              >
                Docs
                <ExternalLink size={12} aria-hidden="true" style={{ color: 'var(--color-text-muted)' }} />
              </a>
            </nav>
          </div>

          {/* Desktop CTA actions */}
          <div className="hidden md:flex" style={{ gap: 12, alignItems: 'center' }}>
            <SignedOut>
              <Link href="/sign-in" className="btn btn-ghost btn-sm" id="header-signin-btn">
                Sign in
              </Link>
              <Link href="/sign-up" className="btn btn-primary btn-sm" id="header-signup-btn">
                Get started free
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn btn-ghost btn-sm" id="header-dashboard-btn">
                Dashboard
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: { width: 32, height: 32 },
                  },
                }}
              />
            </SignedIn>
          </div>

          {/* Accessible Mobile Nav Sheet */}
          <MobileNav />
        </header>

        {/* ─── Hero Section ─────────────────────────────────────────────────── */}
        <section className="hero-section" aria-labelledby="hero-title">
          <p className="hero-eyebrow">Reliable keep-alive infrastructure</p>

          <h1 id="hero-title" className="hero-headline">
            Your services{' '}
            <span style={{ color: 'var(--color-accent)', fontStyle: 'italic', fontWeight: 600 }}>
              stay awake.
            </span>
            <br />
            Automatically.
          </h1>

          <p className="hero-subhead">
            Register an endpoint. Pyra pings it on schedule.
            No sleep mode, no cold start latencies, no forgotten background cron jobs.
          </p>

          {/* Heartbeat pulse — demonstrated directly */}
          <HeartbeatHero />

          <div className="hero-cta-group">
            <Link href="/sign-up" className="btn btn-primary btn-lg" id="hero-signup-btn">
              Start for free
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              See how it works
            </a>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-dim)', margin: 0 }}>
            Free forever tier · No credit card required · Instant activation
          </p>
        </section>

        {/* ─── Trusted-by & Telemetry Strip ─────────────────────────────────── */}
        <TrustedBy />

        {/* ─── Product Showcase (Framed Browser Chrome + Parallax) ──────────── */}
        <ProductShowcase />

        {/* ─── Features Grid ────────────────────────────────────────────────── */}
        <section
          id="features"
          className="reveal"
          style={{ padding: '88px 24px', maxWidth: 1120, margin: '0 auto' }}
          aria-labelledby="features-title"
        >
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="hero-eyebrow" style={{ display: 'inline-block', marginBottom: 12 }}>
              Feature overview
            </p>
            <h2 id="features-title">Everything required to stay live</h2>
            <p style={{ maxWidth: 540, margin: '12px auto 0', fontSize: 17 }}>
              Built specifically for modern serverless apps, background workers, and production APIs.
            </p>
          </div>

          <div className="grid-2 stagger-group" style={{ gap: 24 }}>
            {features.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    height: '100%',
                    padding: '28px 26px',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-accent-glow)',
                      color: 'var(--color-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.65, margin: 0 }}>
                    {f.description}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ─── How it works (Sequential numbered steps) ─────────────────────── */}
        <section
          id="how-it-works"
          className="reveal"
          style={{
            padding: '88px 24px',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-alt)',
          }}
          aria-labelledby="how-it-works-title"
        >
          <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
            <p className="hero-eyebrow" style={{ display: 'inline-block', marginBottom: 12 }}>
              Workflow
            </p>
            <h2 id="how-it-works-title">Three steps. Then forget about it.</h2>
            <p style={{ marginTop: 12, fontSize: 17 }}>
              Get endpoints scheduled and protected in less than two minutes.
            </p>

            <div
              className="stagger-group"
              style={{ display: 'flex', flexDirection: 'column', marginTop: 48 }}
            >
              {steps.map((item, i) => (
                <div
                  key={item.step}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 24,
                    padding: '28px 28px',
                    textAlign: 'left',
                    marginBottom: i < steps.length - 1 ? 16 : 0,
                    background: 'var(--color-surface)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 32,
                      fontWeight: 700,
                      color: 'var(--color-accent)',
                      lineHeight: 1,
                      minWidth: 48,
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </span>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: 8, fontWeight: 600 }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.65, margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─────────────────────────────────────────────────── */}
        <Testimonials />

        {/* ─── Pricing ──────────────────────────────────────────────────────── */}
        <section
          id="pricing"
          className="reveal"
          style={{
            padding: '88px 24px',
            borderTop: '1px solid var(--color-border)',
          }}
          aria-labelledby="pricing-title"
        >
          <div style={{ maxWidth: 940, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <p className="hero-eyebrow" style={{ display: 'inline-block', marginBottom: 12 }}>
                Transparent pricing
              </p>
              <h2 id="pricing-title">Simple, predictable plans</h2>
              <p style={{ marginTop: 12, fontSize: 17 }}>
                Start free forever. Upgrade when your team grows or latency requirements tighten.
              </p>
            </div>

            <div className="grid-2 stagger-group" style={{ gap: 28, alignItems: 'stretch' }}>
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className="card"
                  style={{
                    height: '100%',
                    border: plan.highlight
                      ? '2px solid var(--color-accent)'
                      : '1px solid var(--color-border)',
                    position: 'relative',
                    padding: '36px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: plan.highlight ? 'var(--shadow-raised)' : 'var(--shadow-resting)',
                  }}
                >
                  <div>
                    {plan.highlight && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          background: 'var(--color-accent)',
                          color: '#FFFFFF',
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          padding: '4px 12px',
                          borderRadius: 100,
                        }}
                      >
                        Most Popular
                      </div>
                    )}

                    <div style={{ marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {plan.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 44, fontWeight: 700, color: 'var(--color-text)' }}>
                        {plan.price}
                      </span>
                      <span style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                        / {plan.period}
                      </span>
                    </div>

                    <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28, minHeight: 40 }}>
                      {plan.description}
                    </p>

                    <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: 24 }} />

                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36, padding: 0 }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: 'var(--color-text)' }}>
                          <span
                            style={{
                              color: 'var(--color-success)',
                              background: 'rgba(76, 122, 70, 0.12)',
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
                            <Check size={13} aria-hidden="true" />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={plan.href}
                    className={`btn w-full ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    style={{ padding: '12px 20px', fontSize: 15 }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Warm CTA Banner ──────────────────────────────────────────────── */}
        <CtaBanner />

        {/* ─── Footer ───────────────────────────────────────────────────────── */}
        <footer
          style={{
            borderTop: '1px solid var(--color-border)',
            padding: '48px 48px',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 20,
            }}
          >
            <Link
              href="/"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-text)',
                textDecoration: 'none',
              }}
              id="footer-logo"
            >
              Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
            </Link>

            <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
              <Link href="/privacy" className="link-underline" style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                Privacy
              </Link>
              <Link href="/terms" className="link-underline" style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>
                Terms
              </Link>
              <a
                href="mailto:hello@pyra.dev"
                className="link-underline"
                style={{ fontSize: 14, color: 'var(--color-text-muted)' }}
              >
                Contact
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link-underline"
                style={{ fontSize: 14, color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                aria-label="GitHub Repository (opens in a new tab)"
              >
                GitHub
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>

            <span style={{ fontSize: 13, color: 'var(--color-text-dim)' }}>
              © {new Date().getFullYear()} Pyra Inc. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </GSAPProvider>
  )
}
