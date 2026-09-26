import type { Metadata } from 'next'
import Link from 'next/link'
import { requireRole } from '@/lib/auth'
import { withTenant } from '@/lib/db'
import { getTarget } from '@/lib/repositories/target.repo'
import { ArrowLeft, Globe, FileCode, Code, Server, Sparkles } from 'lucide-react'
import VerifyButton from './verify-button'

export const metadata: Metadata = { title: 'Verify Domain Ownership' }

const CLOUD_PLATFORMS: Record<string, string> = {
  'vercel.app': 'Vercel',
  'onrender.com': 'Render',
  'railway.app': 'Railway',
  'fly.dev': 'Fly.io',
  'koyeb.app': 'Koyeb',
  'supabase.co': 'Supabase',
  'netlify.app': 'Netlify',
  'pages.dev': 'Cloudflare Pages',
  'deno.dev': 'Deno Deploy',
  'glitch.me': 'Glitch',
}

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

  // Detect if target is running on a shared cloud subdomain
  let detectedPlatform: string | null = null
  for (const [domain, platform] of Object.entries(CLOUD_PLATFORMS)) {
    if (hostname.endsWith(domain)) {
      detectedPlatform = platform
      break
    }
  }

  return (
    <div style={{ maxWidth: 880 }}>
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

      <div style={{ marginBottom: 28 }}>
        <h4 style={{ marginBottom: 6 }}>Verify Endpoint Ownership</h4>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Target: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>{target.url}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Choose any one of the verification methods below. Once confirmed, high-frequency 5-minute and 1-minute ping cadences will be unlocked.
        </p>
      </div>

      {/* ─── Cloud Platform Detected Notice ───────────────────────────────── */}
      {detectedPlatform && (
        <div
          style={{
            background: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 22px',
            marginBottom: 24,
            display: 'flex',
            gap: 14,
            alignItems: 'flex-start',
          }}
        >
          <Sparkles size={20} style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)', marginBottom: 4 }}>
              {detectedPlatform} Subdomain Detected (<code style={{ fontFamily: 'var(--font-mono)' }}>{hostname}</code>)
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
              <strong>Keep-alive is already active:</strong> Free targets ping every 10 minutes out of the box to prevent container sleep without any verification needed.
              Because <code style={{ fontFamily: 'var(--font-mono)' }}>{hostname}</code> is a shared cloud subdomain, DNS TXT records cannot be added. Please use <strong>Method 1 (HTML Meta Tag)</strong> or <strong>Method 2 (HTTP Response Header / JSON)</strong> below.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* ─── Method 1: HTML Meta Tag (Recommended for Vercel / Web Apps) ─── */}
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
              <Code size={18} aria-hidden="true" />
            </div>
            <div>
              <h5 style={{ margin: 0 }}>Method 1: HTML Meta Tag (Instant for Vercel / Web Apps)</h5>
              <span style={{ fontSize: 12, color: 'var(--color-accent)' }}>Recommended for Next.js, React, Astro, or static sites</span>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Add the following <code style={{ fontFamily: 'var(--font-mono)' }}>&lt;meta&gt;</code> tag to your homepage or root layout HTML:
          </p>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              overflowX: 'auto',
            }}
          >
            <div style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>
              HTML snippet:
            </div>
            <code style={{ color: 'var(--color-accent)', userSelect: 'all' }}>
              &lt;meta name=&quot;pyra-verification&quot; content=&quot;{token}&quot; /&gt;
            </code>

            <div style={{ borderTop: '1px solid var(--color-border)', marginTop: 14, paddingTop: 12 }}>
              <div style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>
                Next.js App Router (app/layout.tsx):
              </div>
              <pre style={{ margin: 0, color: 'var(--color-text)', fontSize: 12 }}>
{`export const metadata = {
  other: {
    'pyra-verification': '${token}',
  },
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* ─── Method 2: HTTP Response Header or JSON (Recommended for APIs) ── */}
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
              <Server size={18} aria-hidden="true" />
            </div>
            <div>
              <h5 style={{ margin: 0 }}>Method 2: HTTP Header or JSON Response (Instant for APIs)</h5>
              <span style={{ fontSize: 12, color: 'var(--color-accent)' }}>Recommended for Express, FastAPI, Django, Go services on Render, Fly, or Railway</span>
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Configure your target endpoint (<code style={{ fontFamily: 'var(--font-mono)' }}>{target.url}</code>) to return either a header or a JSON property:
          </p>

          <div
            style={{
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Option A: HTTP Header
              </span>
              <code style={{ color: 'var(--color-accent)', userSelect: 'all' }}>
                x-pyra-verification: {token}
              </code>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 10 }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: 11, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                Option B: JSON Response Body
              </span>
              <code style={{ color: 'var(--color-accent)', userSelect: 'all' }}>
                &#123; &quot;status&quot;: &quot;ok&quot;, &quot;pyra&quot;: &quot;{token}&quot; &#125;
              </code>
            </div>
          </div>
        </div>

        {/* ─── Method 3: Well-Known File ────────────────────────────────────── */}
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
            <h5 style={{ margin: 0 }}>Method 3: Well-Known HTTP Route</h5>
          </div>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Serve a plaintext response from your server at the following standard route:
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
              <strong style={{ color: 'var(--color-accent)', userSelect: 'all' }}>{token}</strong>
            </div>
          </div>
        </div>

        {/* ─── Method 4: DNS TXT Record (Custom Domains Only) ──────────────── */}
        <div className="card" style={{ padding: 28, opacity: detectedPlatform ? 0.75 : 1 }}>
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
            <div>
              <h5 style={{ margin: 0 }}>Method 4: DNS TXT Record {detectedPlatform ? '(Custom Domains Only)' : ''}</h5>
              {detectedPlatform && (
                <span style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                  Not available for {detectedPlatform} subdomains; only for custom domains like mydomain.com
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Add the following TXT record to your DNS registrar (Cloudflare, Route53, Namecheap, etc.):
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
              <strong style={{ color: 'var(--color-accent)', userSelect: 'all' }}>pyra-verify={token}</strong>
            </div>
          </div>
        </div>

        {/* Verification Trigger Button */}
        <VerifyButton targetId={id} />
      </div>
    </div>
  )
}
