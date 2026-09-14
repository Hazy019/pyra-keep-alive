import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy — Pyra',
  description: 'How Pyra collects, encrypts, and handles your target endpoints and telemetry data.',
}

export default function PrivacyPage() {
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
          <h1 style={{ fontSize: '2rem', marginBottom: 12 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-dim)', marginBottom: 32 }}>
            Last updated: September 14, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontSize: 15, lineHeight: 1.7 }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>1. Information We Collect</h2>
              <p>
                When you create a Pyra account, we collect your email address and authentication identifiers provided through Clerk. When configuring keep-alive targets, you provide endpoint URLs, optional HTTP authorization tokens, and desired ping frequencies.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>2. Envelope Encryption for Authorization Headers</h2>
              <p>
                Any Authorization headers or API credentials stored for authenticating keep-alive pings are encrypted at rest using AES-256-GCM envelope encryption. Secrets are decrypted strictly in memory by worker nodes at scheduled execution time and are never written to unencrypted logs or telemetry streams.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>3. Multi-Tenant Database Isolation</h2>
              <p>
                All account records, targets, and execution logs are isolated via Postgres Row-Level Security (RLS) enforced at the database connection pool layer. Your infrastructure configurations are cryptographically and structurally inaccessible to other tenant workspaces.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>4. Telemetry and Ping Logs</h2>
              <p>
                We record HTTP status codes, execution timestamps, and round-trip response latencies in order to provide your uptime dashboard and trigger configured alert thresholds. We do not inspect or store response payloads returned by your servers.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 8 }}>5. Contact Us</h2>
              <p>
                For privacy inquiries or data deletion requests, contact our infrastructure security team at{' '}
                <a href="mailto:privacy@pyra.dev" className="link-underline">
                  privacy@pyra.dev
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
