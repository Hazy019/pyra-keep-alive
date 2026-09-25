import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { sql } from 'drizzle-orm'
import * as schema from './schema'

export type ServerlessDb = ReturnType<typeof drizzle<typeof schema>>
export type ServerlessTx = Parameters<Parameters<ServerlessDb['transaction']>[0]>[0]
export type DbClient = ServerlessDb | ServerlessTx

export function createServerlessDb(connectionString: string): { db: ServerlessDb; pool: Pool } {
  const pool = new Pool({ connectionString })
  const db = drizzle(pool, { schema })
  return { db, pool }
}

export async function executeWithTenant<T>(
  db: ServerlessDb,
  tenantId: string,
  fn: (tx: ServerlessTx) => Promise<T>,
): Promise<T> {
  return await db.transaction(async (tx) => {
    try {
      await tx.execute(sql`SET LOCAL ROLE pyra_app`)
    } catch (err) {
      if (process.env['NODE_ENV'] === 'production') {
        throw new Error(
          `Failed to set role pyra_app for tenant isolation: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
      // In unmigrated environments, fall back to current role
    }
    await tx.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`)
    return await fn(tx)
  })
}
