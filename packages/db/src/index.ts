import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export * from './schema'

/**
 * Creates a Drizzle database client for Neon serverless Postgres.
 *
 * IMPORTANT: After creating the client, every request MUST call
 *   SET LOCAL app.current_tenant_id = '<uuid>'
 * within the same transaction before any schema query. This activates the
 * RLS policies on all tables.
 *
 * The web app wraps this via `packages/db/src/with-tenant.ts`.
 */
export function createDb(connectionString: string) {
  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export type Db = ReturnType<typeof createDb>

export * from './with-tenant'
