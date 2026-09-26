'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { Activity, Target, History, Users, Settings, ChevronsUpDown } from 'lucide-react'
import PyraLogo from '@/components/pyra-logo'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/dashboard/targets', label: 'Targets', icon: Target },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  const workspaceName =
    user?.firstName
      ? `${user.firstName}'s Workspace`
      : user?.primaryEmailAddress?.emailAddress
        ? `${user.primaryEmailAddress.emailAddress.split('@')[0]}'s Workspace`
        : 'Pyra Workspace'

  const monogramLetter = (workspaceName.charAt(0) || 'P').toUpperCase()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <Link href="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <PyraLogo size={24} />
      </Link>

      {/* Workspace Identity Block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          margin: '0 0 16px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-resting)',
          cursor: 'default',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, var(--color-accent) 0%, #DF551F 100%)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
            boxShadow: '0 1px 3px rgba(232, 98, 44, 0.3)',
          }}
          aria-hidden="true"
        >
          {monogramLetter}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {workspaceName}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--color-success)',
                background: 'var(--tint-success-bg)',
                padding: '1px 5px',
                borderRadius: 4,
                border: '1px solid var(--tint-success-border)',
              }}
            >
              Active
            </span>
          </div>
        </div>
        <ChevronsUpDown size={14} style={{ color: 'var(--color-text-dim)', flexShrink: 0 }} aria-hidden="true" />
      </div>

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
              prefetch={true}
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
