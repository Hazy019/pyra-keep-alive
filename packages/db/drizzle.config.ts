import type { Config } from 'drizzle-kit'
import { resolve } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'

// Load .env.local or .env from monorepo root
for (const envFile of ['../../.env.local', '../../.env', '../web/.env.local']) {
  const fullPath = resolve(__dirname, envFile)
  if (existsSync(fullPath)) {
    const content = readFileSync(fullPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim()
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
          if (!process.env[key] && val) {
            process.env[key] = val
          }
        }
      }
    }
  }
}

export default {
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL_UNPOOLED'] ?? process.env['DATABASE_URL'] ?? '',
  },
  verbose: true,
  strict: false,
} satisfies Config

