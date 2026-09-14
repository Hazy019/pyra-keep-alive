/** Payload shape for the `notifications` BullMQ queue */
export interface NotificationPayload {
  targetId: string
  tenantId: string
  url: string
  consecutiveFailures: number
  latestErrorMessage: string
  latestStatusCode: number | null
}
