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
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { decryptAuthHeader } from '@/lib/crypto'
import { executePing, type PingResult } from '@/lib/ping-service'

// Max execution time for Vercel Serverless (in seconds)
export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface DueTargetRow {
  id: string
  tenant_id: string
  url: string
  auth_header_encrypted: Buffer | string | null
  consecutive_failures: number
}

async function handleSweep(request: Request) {
  const sweepStart = Date.now()

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

  const dbClient = db()

  try {
    // 2. Atomically claim due targets with SKIP LOCKED
    const dueSql = sql`
      UPDATE targets
      SET next_run_at = now() + (ping_interval_minutes * interval '1 minute')
      WHERE id IN (
        SELECT id FROM targets
        WHERE active = true AND next_run_at <= now()
        ORDER BY next_run_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        tenant_id,
        url,
        auth_header_encrypted,
        consecutive_failures
    `

    const queryResult = await dbClient.execute(dueSql)
    const rows = (queryResult.rows ?? queryResult) as unknown as DueTargetRow[]

    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        swept: 0,
        message: 'No targets currently due for pinging',
        durationMs: Date.now() - sweepStart,
      })
    }

    // 3. Concurrently ping all due targets
    const pingPromises = rows.map(async (target) => {
      let plainAuth: string | null = null
      if (target.auth_header_encrypted) {
        try {
          plainAuth = decryptAuthHeader(target.auth_header_encrypted)
        } catch (decryptErr) {
          console.warn(`[cron/sweep] Auth decryption failed for target ${target.id}:`, decryptErr)
        }
      }

      try {
        const pingResult: PingResult = await executePing(
          dbClient,
          target.tenant_id,
          target.id,
          target.url,
          plainAuth,
        )

        return {
          id: target.id,
          url: target.url,
          success: pingResult.success,
          statusCode: pingResult.statusCode,
          latencyMs: pingResult.latencyMs,
          error: pingResult.errorMessage,
        }
      } catch (pingErr) {
        return {
          id: target.id,
          url: target.url,
          success: false,
          statusCode: null,
          latencyMs: null,
          error: pingErr instanceof Error ? pingErr.message : String(pingErr),
        }
      }
    })

    const results = await Promise.allSettled(pingPromises)
    const formatted = results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { id: 'unknown', url: '', success: false, error: String(r.reason) },
    )

    const totalDuration = Date.now() - sweepStart

    return NextResponse.json({
      success: true,
      swept: formatted.length,
      durationMs: totalDuration,
      results: formatted,
    })
  } catch (err) {
    console.error('[cron/sweep] Sweep execution error:', err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - sweepStart,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  return handleSweep(request)
}

export async function POST(request: Request) {
  return handleSweep(request)
}
