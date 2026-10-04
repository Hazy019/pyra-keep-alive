**
 * Sweep Engine — Core batch execution logic for scheduled keep-alive pings.
 *
 * Reusable across:
 * 1. Dedicated Cron Route (`/api/cron/sweep`) — triggered via Vercel Cron, GitHub Actions, or external webhooks.
 * 2. Opportunistic Passive Sweeper — triggered on dashboard visits / polling if targets are overdue.
 */

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { decryptAuthHeader } from '@/lib/crypto'
import { executePing, type PingResult } from '@/lib/ping-service'

export interface DueTargetRow {
  id: string
  tenant_id: string
  url: string
  auth_header_encrypted: Buffer | string | null
  consecutive_failures: number
}

export interface SweepBatchResult {
  success: boolean
  swept: number
  durationMs: number
  message?: string
  error?: string
  results?: Array<{
    id: string
    url: string
    success: boolean
    statusCode: number | null
    latencyMs: number | null
    error?: string | null
  }>
}

/**
 * Executes a single atomic sweep batch:
 * Claims up to `limit` due targets with FOR UPDATE SKIP LOCKED, executes HTTP pings, and records telemetry.
 */
export async function runSweepBatch(limit = 50): Promise<SweepBatchResult> {
  const sweepStart = Date.now()
  const dbClient = db()

  try {
    const dueSql = sql`
      UPDATE targets
      SET next_run_at = now() + (ping_interval_minutes * interval '1 minute')
      WHERE id IN (
        SELECT id FROM targets
        WHERE active = true AND next_run_at <= now()
        ORDER BY next_run_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING
        id,
        tenant_id,
        url,
        auth_header_encrypted,
        consecutive_failures
    `

    // ─── Cross-tenant batch claim ────────────────────────────────────────────
    // The sweep must claim targets across ALL tenants. SET LOCAL ROLE neondb_owner
    // bypasses RLS for the duration of this transaction so all tenants' rows are
    // visible. The role reverts automatically when the transaction closes.
    let rows: DueTargetRow[] = []
    await dbClient.transaction(async (tx) => {
      try {
        await tx.execute(sql`SET LOCAL ROLE neondb_owner`)
      } catch {
        // In dev/test, neondb_owner may not exist — fall through.
        console.warn('[sweep-engine] Could not SET LOCAL ROLE neondb_owner (dev/test only)')
      }
      const queryResult = await tx.execute(dueSql)
      rows = (queryResult.rows ?? queryResult) as unknown as DueTargetRow[]
    })

    if (!rows || rows.length === 0) {
      return {
        success: true,
        swept: 0,
        message: 'No targets currently due for pinging',
        durationMs: Date.now() - sweepStart,
      }
    }

    const pingPromises = rows.map(async (target) => {
      let plainAuth: string | null = null
      if (target.auth_header_encrypted) {
        try {
          plainAuth = decryptAuthHeader(target.auth_header_encrypted)
        } catch (decryptErr) {
          console.warn(`[sweep-engine] Auth decryption failed for target ${target.id}:`, decryptErr)
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
        : { id: 'unknown', url: '', success: false, statusCode: null, latencyMs: null, error: String(r.reason) },
    )

    return {
      success: true,
      swept: formatted.length,
      durationMs: Date.now() - sweepStart,
      results: formatted,
    }
  } catch (err) {
    console.error('[sweep-engine] Sweep batch execution error:', err)
    return {
      success: false,
      swept: 0,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - sweepStart,
    }
  }
}

// In-memory throttle timestamp to avoid hammering the DB on rapid dashboard refreshes
let lastOpportunisticCheck = 0
const OPPORTUNISTIC_THROTTLE_MS = 25_000 // At most once every 25 seconds

/**
 * Non-blocking opportunistic sweeper:
 * Called passively during dashboard history polling or page navigation.
 * Guarantees targets are pinged even if external cron triggers are delayed or missing.
 */
export function triggerOpportunisticSweep(): void {
  const now = Date.now()
  if (now - lastOpportunisticCheck < OPPORTUNISTIC_THROTTLE_MS) {
    return
  }
  lastOpportunisticCheck = now

  // Fire-and-forget in the background
  void (async () => {
    try {
      const dbClient = db()
      const checkSql = sql`
        SELECT id FROM targets
        WHERE active = true AND next_run_at <= now()
        LIMIT 1
      `
      let dueRows: Array<{ id: string }> = []
      await dbClient.transaction(async (tx) => {
        try {
          await tx.execute(sql`SET LOCAL ROLE neondb_owner`)
        } catch {
          // Fall back silently in dev/test
        }
        const checkResult = await tx.execute(checkSql)
        dueRows = (checkResult.rows ?? checkResult) as unknown as Array<{ id: string }>
      })

      if (dueRows && dueRows.length > 0) {
        await runSweepBatch(20)
      }
    } catch (err) {
      console.warn('[sweep-engine] Opportunistic sweep error:', err)
    }
  })()
}
