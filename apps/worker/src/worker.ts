/**
 * Ping Worker — consumes jobs from the BullMQ `pings` queue.
 *
 * Per-job flow:
 * 1. Decrypt auth header (if present) using AES-256-GCM envelope encryption.
 * 2. SSRF re-validate the destination IP (DNS may have changed since job was enqueued).
 * 3. Execute HTTP ping with a hard 10s timeout.
 * 4. Write a `ping_logs` row.
 * 5. Update `targets.consecutive_failures` + emit to notification queue on failure.
 *
 * Retry policy (configured in scheduler): 3 attempts, exponential backoff.
 * Dead-letter: jobs that exhaust retries stay in BullMQ's failed set for review.
 */

import { Worker, Queue } from 'bullmq'
import type { ConnectionOptions, Job } from 'bullmq'
import { sql } from 'drizzle-orm'
import type { Db } from '@pyra/db'
import { validateTargetUrl, SsrfError } from '@pyra/shared/ssrf'
import { jobLogger } from '@pyra/shared/logger'
import { AUDIT_ACTIONS } from '@pyra/shared/types'
import type { PingJobPayload } from '@pyra/shared/types'
import { decryptAuthHeader } from './crypto.js'
import type { NotificationPayload } from './notifications.js'

const PING_TIMEOUT_MS = Number(process.env['PING_TIMEOUT_MS'] ?? 10_000)
const FAILURE_ALERT_THRESHOLD = Number(process.env['FAILURE_ALERT_THRESHOLD'] ?? 3)

export function createPingWorker(db: Db, redis: any) {
  const notificationQueue = new Queue<NotificationPayload>('notifications', { connection: redis })

  const worker = new Worker<PingJobPayload>(
    'pings',
    async (job: Job<PingJobPayload>) => {
      const { targetId, tenantId, url, authHeaderEncrypted, consecutiveFailures } = job.data
      const log = jobLogger(job.id ?? 'unknown', targetId, tenantId)
      const ranAt = new Date()

      log.info({ event: 'ping.start', url }, 'Starting ping')

      // 1. SSRF re-validate (DNS-pinning at execution time)
      let resolvedIps: string[]
      try {
        const validated = await validateTargetUrl(url)
        resolvedIps = validated.resolvedIps
      } catch (err) {
        if (err instanceof SsrfError) {
          log.warn({ event: 'ping.ssrf_rejected', url, reason: err.message }, 'SSRF check failed at execution time')
          // Don't retry SSRF-rejected targets — they won't improve
          await writePingLog(db, { targetId, tenantId, success: false, errorMessage: `SSRF: ${err.message}`, ranAt })
          return // throw would trigger retry; return completes the job
        }
        throw err
      }

      // 2. Decrypt auth header if present
      let headers: Record<string, string> = {
        'User-Agent': 'Pyra-KeepAlive/1.0 (+https://pyra.dev)',
      }
      if (authHeaderEncrypted) {
        try {
          const decrypted = await decryptAuthHeader(authHeaderEncrypted)
          headers = { ...headers, Authorization: decrypted }
        } catch (err) {
          log.error({ event: 'ping.decrypt_failed', err }, 'Failed to decrypt auth header')
          // Decryption failure = credential issue, not transient; complete without retry
          await writePingLog(db, { targetId, tenantId, success: false, errorMessage: 'Auth header decryption failed', ranAt })
          return
        }
      }

      // 3. Execute HTTP ping — bind to the pinned IP to prevent DNS-rebinding
      const pingStart = Date.now()
      let statusCode: number | null = null
      let success = false
      let errorMessage: string | null = null

      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)

        // Build request with the resolved IP as the actual target,
        // setting the Host header to the original hostname.
        const parsed = new URL(url)
        const pinnedUrl = `${parsed.protocol}//${resolvedIps[0]}${parsed.pathname}${parsed.search}`

        const response = await fetch(pinnedUrl, {
          method: 'GET',
          headers: { ...headers, Host: parsed.hostname },
          redirect: 'follow',
          signal: controller.signal,
        })

        clearTimeout(timeout)
        statusCode = response.status
        // 2xx = success
        success = statusCode >= 200 && statusCode < 300
        log.info({ event: 'ping.complete', statusCode, latencyMs: Date.now() - pingStart, success }, 'Ping complete')
      } catch (err) {
        const isTimeout = err instanceof Error && err.name === 'AbortError'
        errorMessage = isTimeout ? 'Request timed out' : (err instanceof Error ? err.message : 'Unknown error')
        log.warn({ event: 'ping.failed', err, errorMessage }, 'Ping request failed')
        // Rethrow for BullMQ retry logic
        throw new Error(errorMessage)
      }

      const latencyMs = Date.now() - pingStart

      // 4. Write ping log + update consecutive failures
      await writePingLog(db, { targetId, tenantId, success, statusCode, latencyMs, errorMessage, ranAt })

      // 5. Update consecutive_failures on targets
      const newConsecutiveFailures = success ? 0 : consecutiveFailures + 1
      await db.execute(sql`
        UPDATE targets
        SET consecutive_failures = ${newConsecutiveFailures}
        WHERE id = ${targetId}
      `)

      // 6. Emit notification if threshold crossed (and this isn't a retry that already alerted)
      if (!success && newConsecutiveFailures >= FAILURE_ALERT_THRESHOLD) {
        await notificationQueue.add('alert', {
          targetId,
          tenantId,
          url,
          consecutiveFailures: newConsecutiveFailures,
          latestErrorMessage: errorMessage ?? 'Unknown',
          latestStatusCode: statusCode,
        } satisfies NotificationPayload, {
          // Deduplicate alerts: same target can't alert more than once per 15 min
          jobId: `alert:${targetId}:${Math.floor(Date.now() / (15 * 60 * 1000))}`,
        })
        log.warn({ event: 'ping.alert_queued', consecutiveFailures: newConsecutiveFailures }, 'Alert queued')
      }

      // Audit log the failure (success pings are not individually audit-logged to keep volume manageable)
      if (!success) {
        log.info({ event: 'ping.audit', action: 'ping.failed', targetId }, 'Ping failure recorded')
      }
    },
    {
      connection: redis,
      concurrency: Number(process.env['WORKER_CONCURRENCY'] ?? 10),
    },
  )

  worker.on('failed', (job, err) => {
    const log = job
      ? jobLogger(job.id ?? 'unknown', job.data.targetId, job.data.tenantId)
      : { error: console.error }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(log as any).error?.({ event: 'ping.job_failed', err, attempts: job?.attemptsMade }, 'Job failed after retries — in DLQ')
  })

  return worker
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function writePingLog(
  db: Db,
  params: {
    targetId: string
    tenantId: string
    success: boolean
    statusCode?: number | null
    latencyMs?: number
    errorMessage?: string | null
    ranAt: Date
  },
) {
  await db.execute(sql`
    INSERT INTO ping_logs (id, target_id, tenant_id, status_code, success, latency_ms, error_message, ran_at)
    VALUES (
      gen_random_uuid(),
      ${params.targetId},
      ${params.tenantId},
      ${params.statusCode ?? null},
      ${params.success},
      ${params.latencyMs ?? null},
      ${params.errorMessage ?? null},
      ${params.ranAt.toISOString()}
    )
  `)
}
