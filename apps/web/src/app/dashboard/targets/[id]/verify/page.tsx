import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { getTarget } from '@/lib/repositories/target.repo'
import { ArrowLeft, Globe, FileCode } from 'lucide-react'
import VerifyButton from './verify-button'

export const metadata: Metadata = { title: 'Verify Domain Ownership' }

export default async function VerifyTargetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const ctx = await requireRole('viewer')

  let target = null

  if (process.env['DATABASE_URL']) {
    try {
      target = await withTenant(ctx.tenantId, (db) => getTarget(db, ctx.tenantId, id))
    } catch {
      target = null
    }
  }

  if (!target) {
    target = {
      id,
      url: 'https://api.example.com/health',
      verified: false,
      verificationToken: `pyra_token_${id.slice(0, 12)}`,
    }
  }

  const token = target.verificationToken ?? `pyra_challenge_${id.slice(0, 10)}`

  let hostname = 'yourdomain.com'
  try {
    hostname = new URL(target.url).hostname
  } catch {
    hostname = 'yourdomain.com'
  }

  return (
    <div style={{ maxWidth: 840 }}>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/dashboard/targets/${id}`}
          className="btn btn-ghost btn-sm"
          style={{ paddingLeft: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Target
        </Link>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h4 style={{ marginBottom: 6 }}>Verify Domain Ownership</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Target: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{target.url}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Verifying domain ownership proves you control this host and unlocks high-frequency 1-minute and hourly ping cadences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ─── Method 1: DNS TXT Record ─────────────────────────────────────── */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
              }}
            >
              <Globe size={18} aria-hidden="true" />
            </div>
            <h5 style={{ margin: 0 }}>Method 1: DNS TXT Record (Recommended)</h5>
          </div>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Add the following TXT record to your DNS provider (Cloudflare, Route53, Namecheap, etc.):
          </p>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Record Type
              </span>
              <strong>TXT</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Host / Name
              </span>
              <strong>_pyra-challenge.{hostname}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Value / Content
              </span>
              <strong style={{ color: 'var(--color-accent)' }}>pyra-verify={token}</strong>
            </div>
          </div>
        </div>

        {/* ─── Method 2: Well-Known File ────────────────────────────────────── */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-accent)',
              }}
            >
              <FileCode size={18} aria-hidden="true" />
            </div>
            <h5 style={{ margin: 0 }}>Method 2: Well-Known HTTP Route</h5>
          </div>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Serve a plaintext response from your server at the following standard well-known URL:
          </p>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Endpoint Route
              </span>
              <strong>https://{hostname}/.well-known/pyra-challenge</strong>
            </div>

            <div>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Expected HTTP Body (text/plain)
              </span>
              <strong style={{ color: 'var(--color-accent)' }}>{token}</strong>
            </div>
          </div>
        </div>

        {/* Verification Trigger Button */}
        <VerifyButton targetId={id} />
      </div>
    </div>
  )
}
