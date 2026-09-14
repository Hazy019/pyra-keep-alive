import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import OnboardingForm from './onboarding-form'

export const metadata = {
  title: 'Setup Workspace — Pyra',
}

export default async function OnboardingPage() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // If user already has an active tenant, forward them to the dashboard
  let hasTenant = Boolean(sessionClaims?.['tenantId'])
  if (!hasTenant && process.env['DATABASE_URL']) {
    try {
      const { db } = await import('@/lib/db')
      const schema = await import('@pyra/db/schema')
      const { eq } = await import('drizzle-orm')

      const dbClient = db()
      const userRows = await dbClient
        .select({ tenantId: schema.memberships.tenantId })
        .from(schema.users)
        .innerJoin(schema.memberships, eq(schema.users.id, schema.memberships.userId))
        .where(eq(schema.users.clerkUserId, userId))
        .limit(1)

      if (userRows[0]?.tenantId) {
        hasTenant = true
      }
    } catch {
      // ignore
    }
  }

  if (hasTenant) {
    redirect('/dashboard')
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'var(--color-bg)',
      }}
    >
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <Link
          href="/"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--color-text)',
            textDecoration: 'none',
          }}
        >
          Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
        </Link>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 6 }}>
          Set up your workspace to begin keeping services alive
        </p>
      </div>

      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-raised)',
          padding: '36px 32px',
        }}
      >
        <h2 style={{ fontSize: '1.45rem', marginBottom: 8, fontWeight: 600 }}>
          Create your workspace
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
          Your workspace holds all your monitored target endpoints, alerting integrations, and team members.
        </p>

        <OnboardingForm />
      </div>
    </main>
  )
}
