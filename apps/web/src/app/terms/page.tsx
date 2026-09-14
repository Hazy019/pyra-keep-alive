import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service — Pyra',
  description: 'Terms and conditions governing use of Pyra Keep-Alive & Uptime services.',
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '48px 24px' }}>
      <main style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            className="btn btn-ghost btn-sm"
            style={{ paddingLeft: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Home
          </Link>
        </div>

        <div className="card" style={{ padding: '40px 36px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginBottom: 32 }}>
            Last updated: September 14, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, lineHeight: 1.7 }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>1. Acceptance of Terms</h2>
              <p>
                By registering for an account or using Pyra, you agree to comply with and be bound by these Terms of Service. If you are entering into this agreement on behalf of a company or legal entity, you represent that you have the authority to bind such entity.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>2. Permitted Use & SSRF Restrictions</h2>
              <p>
                You may only register endpoint URLs that you own, control, or have explicit legal authorization to monitor. Pyra strictly prohibits the submission of private IP addresses (RFC 1918), local loopback interfaces (127.0.0.1, localhost), link-local metadata endpoints (169.254.169.254), or any other targets designed to facilitate Server-Side Request Forgery (SSRF) or unauthorized network scanning.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>3. Domain Verification & Frequency Caps</h2>
              <p>
                To maintain fair network utilization and prevent distributed denial-of-service abuse, endpoints monitored at intervals tighter than 24 hours require active domain ownership verification via DNS TXT record or well-known challenge verification.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>4. Service Availability & Disclaimers</h2>
              <p>
                While Pyra strives for 99.99% operational uptime for our edge ping runners, the service is provided &ldquo;as is&rdquo; without warranties of any kind regarding third-party hosting service wake times, DNS propagation delays, or downstream network outages.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>5. Questions & Legal Inquiries</h2>
              <p>
                For questions regarding these Terms, please contact{' '}
                <a href="mailto:legal@pyra.dev" className="link-underline">
                  legal@pyra.dev
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
