import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/sidebar'

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
    if (err instanceof AuthError && (err.statusCode === 403 || err.message.includes('onboarding'))) {
      redirect('/onboarding')
    }
    throw err
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  )
}
