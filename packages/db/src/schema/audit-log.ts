import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetResource: text('target_resource'),
  metadata: jsonb('metadata'),
  // Hash-chain fields: row_hash = sha256(prev_hash || action || metadata || created_at)
  prevHash: text('prev_hash').notNull(),
  rowHash: text('row_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type AuditLogRow = typeof auditLog.$inferSelect
export type NewAuditLogRow = typeof auditLog.$inferInsert
