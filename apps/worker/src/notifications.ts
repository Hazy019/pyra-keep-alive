/**
 * Notification Worker — consumes failure alert jobs from the BullMQ `notifications` queue
 * and dispatches email alerts to tenant administrators via Resend.
 */

import { Worker, type Job } from 'bullmq'
import { sql } from 'drizzle-orm'
import type { Db } from '@pyra/db'
import { logger } from '@pyra/shared/logger'
import type Redis from 'ioredis'
import { fetch as undiciFetch } from 'undici'

export interface NotificationPayload {
  targetId: string
  tenantId: string
  url: string
  consecutiveFailures: number
  latestErrorMessage: string
  latestStatusCode: number | null
}

interface RecipientRow extends Record<string, unknown> {
  email: string
  role: string
}

export function createNotificationWorker(db: Db, redis: Redis) {
  const worker = new Worker<NotificationPayload>(
    'notifications',
    async (job: Job<NotificationPayload>) => {
      const { targetId, tenantId, url, consecutiveFailures, latestErrorMessage, latestStatusCode } =
        job.data

      logger.info(
        { event: 'notification.process', jobId: job.id, targetId, tenantId, consecutiveFailures },
        `Processing alert for target: ${url}`,
      )

      // 1. Look up email recipients (owners and admins of the tenant)
      let recipients: string[] = []
      try {
        const result = await db.execute<RecipientRow>(sql`
          SELECT u.email, m.role
          FROM memberships m
          JOIN users u ON m.user_id = u.id
          WHERE m.tenant_id = ${tenantId}
            AND m.role IN ('owner', 'admin')
        `)

        const rows = (result.rows ?? result) as unknown as RecipientRow[]
        recipients = rows.map((r) => r.email).filter(Boolean)
      } catch (err) {
        logger.error(
          { event: 'notification.db_error', err, tenantId },
          'Failed to query tenant recipients for notification',
        )
        throw err
      }

      if (recipients.length === 0) {
        logger.warn(
          { event: 'notification.no_recipients', tenantId, targetId },
          'No admin or owner recipients found for tenant alert',
        )
        return
      }

      // 2. Dispatch email via Resend
      const resendApiKey = process.env['RESEND_API_KEY']
      const fromEmail = process.env['NOTIFICATION_FROM_EMAIL'] ?? 'Pyra Alerts <alerts@pyra.dev>'

      if (!resendApiKey) {
        logger.warn(
          { event: 'notification.dry_run', targetId, recipients, consecutiveFailures },
          'RESEND_API_KEY not configured; alert email logged as dry run',
        )
        return
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FBF9F6; margin: 0; padding: 32px 16px; color: #211D1A;">
  <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7DFD6; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(33,29,26,0.06);">
    <div style="font-size: 20px; font-weight: 700; color: #E8622C; margin-bottom: 16px; letter-spacing: -0.02em;">
      Pyra Endpoint Alert
    </div>
    <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #B23A2E;">
      Target is failing health checks
    </h2>
    <p style="font-size: 14px; line-height: 1.6; color: #6B6460; margin: 0 0 20px 0;">
      Your monitored endpoint has failed <strong>${consecutiveFailures} consecutive checks</strong>.
    </p>

    <div style="background: #F3EDE6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #8E8681; margin-bottom: 4px;">Target URL</div>
      <div style="font-family: monospace; font-size: 13px; color: #211D1A; word-break: break-all; margin-bottom: 12px;">${url}</div>
      
      <div style="display: flex; gap: 24px;">
        <div>
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8E8681;">Status</div>
          <div style="font-size: 13px; font-weight: 600; color: #B23A2E;">${latestStatusCode ?? 'Timeout / Network Error'}</div>
        </div>
        <div>
          <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #8E8681;">Error</div>
          <div style="font-size: 13px; color: #6B6460;">${latestErrorMessage}</div>
        </div>
      </div>
    </div>

    <a href="${process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://pyra.dev'}/dashboard"
       style="display: inline-block; background: #E8622C; color: #FFFFFF; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
      View in Dashboard
    </a>
  </div>
</body>
</html>
      `.trim()

      try {
        const response = await undiciFetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: recipients,
            subject: `[Alert] Keep-alive target failing: ${url}`,
            html: emailHtml,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Resend API returned ${response.status}: ${errorText}`)
        }

        logger.info(
          { event: 'notification.sent', targetId, recipientsCount: recipients.length },
          'Alert email dispatched successfully',
        )
      } catch (err) {
        logger.error(
          { event: 'notification.dispatch_failed', err, targetId },
          'Failed to send alert email via Resend',
        )
        throw err
      }
    },
    {
      connection: redis,
      concurrency: 5,
    },
  )

  worker.on('error', (err) => {
    logger.error({ event: 'notification.worker_error', err }, 'Notification worker error')
  })

  return worker
}
