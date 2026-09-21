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

  try {
    await getSessionContext()
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
      <Sidebar />
      <div className="dashboard-main-wrapper">
        <MobileNav />
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}
