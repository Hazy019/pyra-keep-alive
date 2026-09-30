'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardAutoRefreshProps {
  intervalMs?: number
}

/**
 * Periodically refreshes server component data when the page tab is visible.
 * Default interval: 15,000ms (15 seconds)
 */
export default function DashboardAutoRefresh({ intervalMs = 15000 }: DashboardAutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        router.refresh()
      }
    }, intervalMs)

    return () => clearInterval(timer)
  }, [router, intervalMs])

  return null
}
