/**
 * Database client with per-request tenant context injection.
 *
 * Every database connection used by the API layer MUST go through `withTenant()`
 * or `withTenantTx()` — these functions set `app.current_tenant_id` at the
 * session level before any query runs, activating the RLS policies.
 *
 * Never call `createDb()` and run queries without setting the tenant context.
 */

import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { sql } from 'drizzle-orm'
import * as schema from '@pyra/db/schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>
type DbInstance = DrizzleDb | Parameters<Parameters<DrizzleDb['transaction']>[0]>[0]

/**
 * Returns or initializes a pooled Neon client.
 * In development, we preserve the Pool on globalThis to prevent connection leaks across HMR.
 */
function getPool(): Pool {
  const connectionString = process.env['DATABASE_URL']
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }

  if (process.env.NODE_ENV === 'production') {
    return new Pool({ connectionString })
  }

  const globalWithPool = globalThis as typeof globalThis & { _neonPool?: Pool }
  if (!globalWithPool._neonPool) {
    globalWithPool._neonPool = new Pool({ connectionString })
  }
  return globalWithPool._neonPool
}

let _db: DrizzleDb | null = null

export function db(): DrizzleDb {
  if (!_db) {
    const pool = getPool()
    _db = drizzle(pool, { schema })
  }
  return _db
}

/**
 * Executes a callback within a dedicated transaction with tenant RLS context applied.
 *
 * 1. Uses `drizzle-orm/neon-serverless` with a persistent connection pool.
 * 2. Runs inside `db().transaction(async (tx) => ...)`.
 * 3. Switches to `pyra_app` role so `neondb_owner`'s `rolbypassrls` is revoked for this tx.
 * 4. Applies `SELECT set_config('app.current_tenant_id', ${tenantId}, true)` so RLS
 *    policies evaluate against this tenant context for the duration of the transaction.
 * 5. Guarantees zero cross-request contamination across concurrent calls.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (db: DbInstance) => Promise<T>,
): Promise<T> {
  const dbClient = db()
  return await dbClient.transaction(async (tx) => {
    try {
      await tx.execute(sql`SET LOCAL ROLE pyra_app`)
    } catch (err) {
      if (process.env['NODE_ENV'] === 'production') {
        throw new Error(
          `Failed to set role pyra_app for tenant isolation: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
      // In local/test environments where pyra_app is not configured, fall back to current role
    }
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`)
    return await fn(tx as unknown as DbInstance)
  })
}

export type { DbInstance }

