import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  customType,
} from 'drizzle-orm/pg-core'
import { tenants } from './tenants'
import { users } from './users'

// bytea for the encrypted auth header blob
const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return 'bytea'
  },
})

export const targets = pgTable('targets', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  // AES-256-GCM envelope-encrypted; null when no auth is needed
  authHeaderEncrypted: bytea('auth_header_encrypted'),
  // Whether the target owner has verified domain ownership
  verified: boolean('verified').notNull().default(false),
  verificationToken: text('verification_token'),
  // Capped by plan at the API layer; minimum enforced per verification status
  pingIntervalMinutes: integer('ping_interval_minutes').notNull().default(1440),
  active: boolean('active').notNull().default(true),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull().defaultNow(),
  // Consecutive failure counter — reset to 0 on success
  consecutiveFailures: integer('consecutive_failures').notNull().default(0),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Target = typeof targets.$inferSelect
export type NewTarget = typeof targets.$inferInsert
