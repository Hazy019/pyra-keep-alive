'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function MarketingNavAuth() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Render a stable placeholder with matching geometry during SSR to prevent hydration mismatch
    return (
      <div
        className="marketing-desktop-actions"
        style={{ gap: 12, alignItems: 'center', minHeight: 38 }}
      >
        <div style={{ width: 80, height: 36, opacity: 0 }} />
        <div style={{ width: 130, height: 36, opacity: 0 }} />
      </div>
    )
  }

  return (
    <div className="marketing-desktop-actions" style={{ gap: 12, alignItems: 'center' }}>
      <SignedOut>
        <Link href="/sign-in" className="btn btn-ghost" id="header-signin-btn" style={{ fontSize: 14.5, padding: '9px 18px' }}>
          Sign in
        </Link>
        <Link href="/sign-up" className="btn btn-primary btn-magnetic" id="header-signup-btn" style={{ fontSize: 14.5, padding: '9px 20px', fontWeight: 600 }}>
          Get started free
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className="btn btn-ghost" id="header-dashboard-btn" style={{ fontSize: 14.5, padding: '9px 18px', fontWeight: 600 }}>
          Dashboard
        </Link>
        <UserButton
          appearance={{
            elements: { userButtonAvatarBox: { width: 36, height: 36 } },
          }}
        />
      </SignedIn>
    </div>
  )
}
