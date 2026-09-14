'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { Activity, Target, History, Users, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/dashboard/targets', label: 'Targets', icon: Target },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <span>Pyr<span className="logo-ember">a</span></span>
      </Link>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive ? 'active' : ''}`}
              id={`nav-${item.label.toLowerCase()}`}
            >
              <Icon size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px',
          borderTop: '1px solid var(--color-border)',
          marginTop: 8,
        }}
      >
        {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_') &&
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_Y2xlcmsucHlyYS5kZXYk' ? (
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: { width: 28, height: 28 },
              },
            }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              backgroundColor: 'var(--color-surface-alt)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            P
          </div>
        )}
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Account</span>
      </div>
    </aside>
  )
}
