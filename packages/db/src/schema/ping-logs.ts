import { pgTable, uuid, integer, boolean, text, timestamp } from 'drizzle-orm/pg-core'
import { targets } from './targets'
import { tenants } from './tenants'

export const pingLogs = pgTable('ping_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetId: uuid('target_id')
    .notNull()
    .references(() => targets.id, { onDelete: 'cascade' }),
  // Denormalized tenant_id for RLS simplicity (avoids joins in RLS policies)
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  statusCode: integer('status_code'),
  success: boolean('success').notNull(),
  latencyMs: integer('latency_ms'),
  errorMessage: text('error_message'),
  ranAt: timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
})

export type PingLog = typeof pingLogs.$inferSelect
export type NewPingLog = typeof pingLogs.$inferInsert
