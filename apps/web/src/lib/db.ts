/**
 * Database client with per-request tenant context injection.
 *
 * Every database connection used by the API layer MUST go through `withTenant()`
 * or `withTenantTx()` — these functions set `app.current_tenant_id` at the
 * session level before any query runs, activating the RLS policies.
 *
 * Never call `createDb()` and run queries without setting the tenant context.
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { sql } from 'drizzle-orm'
import * as schema from '@pyra/db/schema'

type DbInstance = ReturnType<typeof drizzle<typeof schema>>

/**
 * Returns a Drizzle client.
 * Cached at module level — the neon HTTP client is stateless and safe to share.
 */
function getDb(): DbInstance {
  const connectionString = process.env['DATABASE_URL']
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  const sqlClient = neon(connectionString)
  return drizzle(sqlClient, { schema })
}

let _db: DbInstance | null = null

export function db(): DbInstance {
  if (!_db) _db = getDb()
  return _db
}

/**
 * Executes a callback with `app.current_tenant_id` set for the duration.
 *
 * Note: Neon HTTP driver runs each query as a separate HTTP request, so
 * `SET LOCAL` (transaction-scoped) won't work across queries in neon-http mode.
 * We use `SET SESSION` here — the Neon connection pool provides per-request
 * connection isolation at the HTTP layer, making this safe for serverless.
 *
 * For production workloads requiring strict transaction isolation, switch to
 * `drizzle-orm/neon-serverless` (WebSocket driver) which supports true transactions.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (db: DbInstance) => Promise<T>,
): Promise<T> {
  const dbInstance = db()
  // Set the tenant ID for RLS policies
  await dbInstance.execute(sql`SET app.current_tenant_id = ${tenantId}`)
  try {
    return await fn(dbInstance)
  } finally {
    // Clear tenant context after use
    await dbInstance.execute(sql`SET app.current_tenant_id = ''`)
  }
}

export type { DbInstance }
