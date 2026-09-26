import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'
import MobileNav from '@/components/dashboard/mobile-nav'

import { getSessionContext, AuthError } from '@/lib/auth'

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s — Dashboard | Pyra' },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Re-validate auth in the layout (middleware already guards, but defense in depth)
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  let tenantPlan = 'free'
  try {
    const session = await getSessionContext()
    if (process.env['DATABASE_URL'] && session.tenantId) {
      const { db } = await import('@/lib/db')
      const schema = await import('@pyra/db/schema')
      const { eq } = await import('drizzle-orm')
      const tenantRow = await db()
        .select({ plan: schema.tenants.plan })
        .from(schema.tenants)
        .where(eq(schema.tenants.id, session.tenantId))
        .limit(1)
      if (tenantRow[0]?.plan) {
        tenantPlan = tenantRow[0].plan
      }
    }
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.statusCode === 401) {
        redirect('/sign-in')
      }
      if (err.statusCode === 403 || err.message.includes('onboarding')) {
        redirect('/onboarding')
      }
    }
    throw err
  }

  return (
    <div className="dashboard-layout">
      <Sidebar plan={tenantPlan} />
      <div className="dashboard-main-wrapper">
        <MobileNav plan={tenantPlan} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
