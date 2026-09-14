/**
 * Secrets abstraction layer.
 *
 * Sprint 1: reads from environment variables.
 * Future: swap the implementation here to read from Infisical/Doppler
 * without changing any call-sites.
 */

export interface Secrets {
  databaseUrl: string
  clerkSecretKey: string
  encryptionKey: string
  upstashRedisUrl: string
  upstashRedisToken: string
  redisUrl: string
  resendApiKey: string
  turnstileSecretKey: string
}

/**
 * Returns all required secrets.
 * Throws at startup if any required secret is missing — fail fast, don't run with broken config.
 */
export function getSecrets(): Secrets {
  const required: Array<[keyof Secrets, string]> = [
    ['databaseUrl', 'DATABASE_URL'],
    ['clerkSecretKey', 'CLERK_SECRET_KEY'],
    ['encryptionKey', 'ENCRYPTION_KEY'],
    ['upstashRedisUrl', 'UPSTASH_REDIS_REST_URL'],
    ['upstashRedisToken', 'UPSTASH_REDIS_REST_TOKEN'],
    ['redisUrl', 'REDIS_URL'],
    ['resendApiKey', 'RESEND_API_KEY'],
    ['turnstileSecretKey', 'TURNSTILE_SECRET_KEY'],
  ]

  const secrets = {} as Record<string, string>
  const missing: string[] = []

  for (const [key, envVar] of required) {
    const value = process.env[envVar]
    if (!value) {
      missing.push(envVar)
    } else {
      secrets[key] = value
    }
  }

  if (missing.length > 0) {
    // In development, warn rather than crash so devs can start without all secrets
    if (process.env['NODE_ENV'] === 'development') {
      console.warn(`[pyra/secrets] Missing env vars (development): ${missing.join(', ')}`)
    } else {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
    }
  }

  return secrets as unknown as Secrets
}

/** Returns a single secret by env var name, or throws if missing in production */
export function getSecret(envVar: string): string {
  const value = process.env[envVar]
  if (!value) {
    if (process.env['NODE_ENV'] === 'development') {
      console.warn(`[pyra/secrets] Missing env var: ${envVar}`)
      return ''
    }
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
  return value
}
