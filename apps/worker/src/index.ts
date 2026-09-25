/**
 * Worker entrypoint — starts the Fastify health-check server, scheduler, and BullMQ worker.
 */

import Fastify from 'fastify'
import { Redis } from 'ioredis'
import { createDb } from '@pyra/db'
import { logger } from '@pyra/shared/logger'
import { createScheduler } from './scheduler.js'
import { createPingWorker } from './worker.js'
import { createNotificationWorker } from './notifications.js'

const PORT = Number(process.env['PORT'] ?? 8080)

async function main() {
  // ─── Database ─────────────────────────────────────────────────────────────
  const db = createDb(process.env['DATABASE_URL'] ?? '')

  // ─── Redis ────────────────────────────────────────────────────────────────
  const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
  })

  redis.on('error', (err) => logger.error({ event: 'redis.error', err }, 'Redis connection error'))

  // ─── Scheduler ────────────────────────────────────────────────────────────
  const scheduler = createScheduler(db, redis)
  scheduler.start()

  // ─── Ping Worker ──────────────────────────────────────────────────────────
  const pingWorker = createPingWorker(db, redis)

  // ─── Notification Worker ──────────────────────────────────────────────────
  const notificationWorker = createNotificationWorker(db, redis)

  // ─── Fastify health server ─────────────────────────────────────────────────
  const fastify = Fastify({ logger: false })

  fastify.get('/health', async (_req, reply) => {
    // Basic liveness check
    const redisStatus = redis.status === 'ready' ? 'ok' : 'degraded'
    return reply.code(redisStatus === 'ok' ? 200 : 503).send({
      status: redisStatus === 'ok' ? 'ok' : 'degraded',
      redis: redisStatus,
      scheduler: 'running',
      worker: pingWorker.isRunning() ? 'running' : 'stopped',
      notifications: notificationWorker.isRunning() ? 'running' : 'stopped',
    })
  })

  await fastify.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ event: 'worker.started', port: PORT }, `Worker started on :${PORT}`)

  // ─── Graceful shutdown ────────────────────────────────────────────────────
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, async () => {
      logger.info({ event: 'worker.shutdown', signal }, 'Graceful shutdown initiated')
      scheduler.stop()
      await pingWorker.close()
      await notificationWorker.close()
      await fastify.close()
      await redis.quit()
      logger.info({ event: 'worker.shutdown.done' }, 'Shutdown complete')
      process.exit(0)
    })
  }
}

main().catch((err) => {
  logger.error({ event: 'worker.fatal', err }, 'Unhandled error in worker entrypoint')
  process.exit(1)
})
