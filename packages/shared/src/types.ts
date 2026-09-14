// Pyra shared types — roles, plan limits, error envelope, audit actions

// ─── Roles (ordered by privilege, lowest first) ─────────────────────────────
export const ROLES = ['viewer', 'member', 'admin', 'owner'] as const
export type Role = (typeof ROLES)[number]

/** Numeric weight for comparison: higher = more privileged */
export const ROLE_WEIGHT: Record<Role, number> = {
  viewer: 0,
  member: 1,
  admin: 2,
  owner: 3,
}

/** Returns true if `actual` is at least as privileged as `required` */
export function hasRole(actual: Role, required: Role): boolean {
  return ROLE_WEIGHT[actual] >= ROLE_WEIGHT[required]
}

// ─── Plans ──────────────────────────────────────────────────────────────────
export const PLANS = ['free', 'team'] as const
export type Plan = (typeof PLANS)[number]

/** Per-plan limits (hard-coded for Sprint 1; Stripe enforces in Sprint 2) */
export const PLAN_LIMITS = {
  free: {
    maxTargets: 3,
    /** Minimum interval in minutes allowed without verification */
    minIntervalUnverified: 1440, // once per day
    /** Minimum interval in minutes for verified targets */
    minIntervalVerified: 60, // once per hour
  },
  team: {
    maxTargets: 50,
    minIntervalUnverified: 60,
    minIntervalVerified: 1, // every minute
  },
} satisfies Record<Plan, { maxTargets: number; minIntervalUnverified: number; minIntervalVerified: number }>

// ─── API Error Envelope ─────────────────────────────────────────────────────
export interface ApiErrorEnvelope {
  error: string
  correlationId: string
}

export function makeErrorEnvelope(message: string, correlationId: string): ApiErrorEnvelope {
  return { error: message, correlationId }
}

// ─── Audit actions ──────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
  // Targets
  TARGET_CREATED: 'target.created',
  TARGET_UPDATED: 'target.updated',
  TARGET_DELETED: 'target.deleted',
  TARGET_VERIFIED: 'target.verified',
  // Memberships
  MEMBER_INVITED: 'member.invited',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  MEMBER_REMOVED: 'member.removed',
  // Auth events (mirrors from Clerk webhooks)
  USER_SIGNED_IN: 'user.signed_in',
  USER_SIGNED_OUT: 'user.signed_out',
  USER_MFA_ENABLED: 'user.mfa_enabled',
  // Billing
  PLAN_UPGRADED: 'billing.plan_upgraded',
  PLAN_DOWNGRADED: 'billing.plan_downgraded',
} as const

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS]

// ─── Ping job payload (shared between scheduler and worker) ─────────────────
export interface PingJobPayload {
  targetId: string
  tenantId: string
  url: string
  authHeaderEncrypted: string | null
  consecutiveFailures: number
}
