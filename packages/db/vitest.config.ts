import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

// Load .env.local from monorepo root
const envPath = resolve(__dirname, '../../.env.local')
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
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

export default defineConfig({
  test: {
    environment: 'node',
  },
})
