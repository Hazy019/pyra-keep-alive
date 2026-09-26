'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import {
  Activity,
  Target,
  History,
  Users,
  Settings,
  Menu,
  X,
  Plus,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: Activity },
  { href: '/dashboard/targets', label: 'Targets', icon: Target },
  { href: '/dashboard/history', label: 'History', icon: History },
  { href: '/dashboard/team', label: 'Team', icon: Users },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function MobileNav({ plan = 'free' }: { plan?: string }) {
  const pathname = usePathname()
  const { user } = useUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isTeam = plan === 'team'

  // Auto-close drawer whenever navigation occurs
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const workspaceName =
    user?.firstName
      ? `${user.firstName}'s Workspace`
      : user?.primaryEmailAddress?.emailAddress
        ? `${user.primaryEmailAddress.emailAddress.split('@')[0]}'s Workspace`
        : 'Pyra Workspace'

  const monogramLetter = (workspaceName.charAt(0) || 'P').toUpperCase()

  return (
    <>
      {/* ─── Mobile Sticky Top Header (<= 900px) ─────────────────────────── */}
      <header className="mobile-top-bar">
        {/* Left: Hamburger button + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="mobile-menu-trigger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          <Link href="/dashboard" className="sidebar-logo" style={{ padding: 0, fontSize: 20, textDecoration: 'none' }}>
            <span>Pyr<span className="logo-ember">a</span></span>
          </Link>
        </div>

        {/* Center: Current Workspace Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-full)',
            maxWidth: 160,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: 'var(--color-accent)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {monogramLetter}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {workspaceName}
          </span>
        </div>

        {/* Right: User Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_') &&
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_Y2xlcmsucHlyYS5kZXYk' ? (
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: { width: 30, height: 30 },
                },
              }}
            />
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                backgroundColor: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text)',
              }}
            >
              {monogramLetter}
            </div>
          )}
        </div>
      </header>

      {/* ─── Mobile Slide-Over Drawer Sheet ──────────────────────────────── */}
      {drawerOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <div className="sidebar-logo" style={{ padding: 0, fontSize: 20 }}>
                <span>Pyr<span className="logo-ember">a</span></span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="mobile-close-btn"
                aria-label="Close navigation menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Workspace Identity in Drawer */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
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
                  }}
                >
                  {monogramLetter}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: 'var(--color-text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {workspaceName}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
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
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: isTeam ? '#DF551F' : 'var(--color-text-dim)',
                        background: isTeam ? 'rgba(232, 98, 44, 0.12)' : 'var(--color-surface-2)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        border: isTeam ? '1px solid rgba(232, 98, 44, 0.3)' : '1px solid var(--color-border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {isTeam && <Sparkles size={10} style={{ color: 'var(--color-accent)' }} />}
                      {isTeam ? 'Team Plan' : 'Free Tier'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation List */}
            <nav style={{ padding: '16px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-dim)', padding: '0 10px 4px' }}>
                Navigation
              </span>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{ padding: '12px 14px', fontSize: 14.5 }}
                  >
                    <Icon size={18} style={{ flexShrink: 0 }} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              <div style={{ borderTop: '1px solid var(--color-border)', margin: '12px 0', paddingTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-dim)', padding: '0 10px 8px', display: 'block' }}>
                  Quick Actions
                </span>
                <Link
                  href="/dashboard/targets"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', justifyContent: 'center', gap: 6, padding: '10px 16px' }}
                >
                  <Plus size={15} />
                  <span>Add New Target</span>
                </Link>
              </div>
            </nav>

            {/* Drawer Footer Account */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Tenant RLS Active
                </span>
              </div>
              <Link href="/dashboard/settings" style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
                Settings →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
