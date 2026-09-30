/**
 * GET /api/cron/sweep
 * POST /api/cron/sweep
 *
 * Serverless Keep-Alive Sweep (Option B).
 * Triggered periodically (e.g. every 1-5 minutes) via Vercel Cron or GitHub Actions.
 *
 * Flow:
 * 1. Authenticate request using Bearer CRON_SECRET or query param secret.
 * 2. Atomically claim due targets (active=true AND next_run_at <= now())
 *    using FOR UPDATE SKIP LOCKED, advancing next_run_at immediately.
 * 3. Concurrently execute HTTP pings with SSRF validation, DNS pinning, and auth decryption.
 * 4. Record ping_logs and consecutive failure counts.
 * 5. Return JSON metrics of all processed targets.
 */

import { NextResponse } from 'next/server'
import { runSweepBatch } from '@/lib/sweep-engine'

// Max execution time for Vercel Serverless (in seconds)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

async function handleSweep(request: Request) {
  // 1. Authenticate the cron request
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = request.headers.get('authorization')
  const urlObj = new URL(request.url)
  const querySecret = urlObj.searchParams.get('secret')
  const headerSecret = request.headers.get('x-cron-secret')

  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, '').trim() || querySecret || headerSecret

  if (cronSecret) {
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid CRON_SECRET' }, { status: 401 })
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server' },
      { status: 500 },
    )
  }

  // 2. Execute sweep batch
  const result = await runSweepBatch(50)
  const status = result.success ? 200 : 500
  return NextResponse.json(result, { status })
}

export async function GET(request: Request) {
  return handleSweep(request)
}

export async function POST(request: Request) {
  return handleSweep(request)
}

