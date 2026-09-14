/**
 * Scheduler — sweeps the `targets` table every `SCHEDULER_INTERVAL_MS`
 * for targets whose `next_run_at` is due, enqueues them as BullMQ jobs
 * with jitter, and updates `next_run_at` to prevent double-dispatch.
 *
 * Concurrency safety: `SELECT ... FOR UPDATE SKIP LOCKED` ensures multiple
 * scheduler replicas don't pick up the same row simultaneously.
 */

import { sql } from 'drizzle-orm'
import { Queue } from 'bullmq'
import type { ConnectionOptions } from 'bullmq'
import type { Db } from '@pyra/db'
import { jobLogger } from '@pyra/shared/logger'
import { logger } from '@pyra/shared/logger'
import type { PingJobPayload } from '@pyra/shared/types'

const SCHEDULER_INTERVAL_MS = Number(process.env['SCHEDULER_INTERVAL_MS'] ?? 60_000)
const BATCH_SIZE = Number(process.env['SCHEDULER_BATCH_SIZE'] ?? 500)
/** Max jitter in milliseconds added to job delay to prevent thundering herd */
const MAX_JITTER_MS = 30_000

export function createScheduler(db: Db, redis: any) {
  const queue = new Queue<PingJobPayload>('pings', { connection: redis })

  async function sweep() {
    const sweepStart = Date.now()
    logger.info({ event: 'scheduler.sweep.start' }, 'Scheduler sweep started')

    try {
      // Use a raw transaction with SKIP LOCKED to safely batch-claim due targets
      const dueSql = sql`
        UPDATE targets
        SET next_run_at = now() + (ping_interval_minutes * interval '1 minute')
        WHERE id IN (
          SELECT id FROM targets
          WHERE next_run_at <= now()
          ORDER BY next_run_at ASC
          LIMIT ${BATCH_SIZE}
          FOR UPDATE SKIP LOCKED
        )
        RETURNING
          id,
          tenant_id,
          url,
          auth_header_encrypted,
          consecutive_failures
      `

      const result = await db.execute(dueSql)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = result.rows as any[]

      if (rows.length === 0) {
        logger.debug({ event: 'scheduler.sweep.empty' }, 'No due targets')
        return
      }

      const jobs = rows.map((row) => {
        const jitterMs = Math.floor(Math.random() * MAX_JITTER_MS)
        const log = jobLogger(row.id as string, row.id as string, row.tenant_id as string)
        log.debug({ event: 'scheduler.enqueue', jitterMs }, 'Enqueuing ping job')

        return {
          name: 'ping',
          data: {
            targetId: row.id as string,
            tenantId: row.tenant_id as string,
            url: row.url as string,
            authHeaderEncrypted: (row.auth_header_encrypted as string | null),
            consecutiveFailures: (row.consecutive_failures as number),
          } satisfies PingJobPayload,
          opts: {
            // Use targetId as job ID prefix for deduplication within the window
            jobId: `ping:${row.id as string}:${Date.now()}`,
            delay: jitterMs,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            removeOnComplete: { count: 1000 },
            removeOnFail: false, // keep in DLQ for review
          },
        }
      })

      await queue.addBulk(jobs)

      logger.info(
        { event: 'scheduler.sweep.done', count: rows.length, durationMs: Date.now() - sweepStart },
        `Enqueued ${rows.length} ping jobs`,
      )
    } catch (err) {
      logger.error({ event: 'scheduler.sweep.error', err }, 'Scheduler sweep failed')
    }
  }

  let timer: ReturnType<typeof setInterval> | null = null

  return {
    start() {
      if (timer) return
      logger.info({ event: 'scheduler.start', intervalMs: SCHEDULER_INTERVAL_MS }, 'Scheduler started')
      // Run immediately on start, then on interval
      void sweep()
      timer = setInterval(() => void sweep(), SCHEDULER_INTERVAL_MS)
    },
    stop() {
      if (timer) {
        clearInterval(timer)
        timer = null
        logger.info({ event: 'scheduler.stop' }, 'Scheduler stopped')
      }
    },
    /** Exposed for testing */
    sweep,
  }
}
