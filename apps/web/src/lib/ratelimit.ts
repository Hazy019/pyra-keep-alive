/**
 * Rate limiting helper using @upstash/ratelimit.
 *
 * Protects mutation endpoints from abuse and prevents verification
 * endpoints from being weaponized as outbound scanning / DoS vectors.
 *
 * Fails closed in production: if Upstash credentials are missing in production,
 * an error is thrown at startup to prevent running unthrottled.
 * In development / test environments without credentials, it safely no-ops.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash = Boolean(
  process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN'],
)

if (process.env['NODE_ENV'] === 'production' && !hasUpstash) {
  throw new Error(
    'CRITICAL CONFIG ERROR: Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in production environment. Rate limiting cannot fail open in production.',
  )
}

const redis = hasUpstash
  ? new Redis({
      url: process.env['UPSTASH_REDIS_REST_URL']!,
      token: process.env['UPSTASH_REDIS_REST_TOKEN']!,
    })
  : undefined

/**
 * Target creation limiter: 30 creations per hour per tenant
 */
export const targetCreateRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      prefix: 'ratelimit:target:create',
      analytics: false,
    })
  : null

/**
 * Target verification limiter: 10 verification attempts per minute per target
 */
export const targetVerifyRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:target:verify',
      analytics: false,
    })
  : null

/**
 * Target mutation limiter (PATCH / DELETE): 60 mutations per hour per tenant
 */
export const targetMutationRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 h'),
      prefix: 'ratelimit:target:mutation',
      analytics: false,
    })
  : null

/**
 * Onboarding limiter: 5 attempts per 10 minutes per user
 */
export const onboardingRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '10 m'),
      prefix: 'ratelimit:onboarding',
      analytics: false,
    })
  : null

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60_000 }
  }

  return await limiter.limit(identifier)
}
