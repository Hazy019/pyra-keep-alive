'use client'

import { useState } from 'react'
import Link from 'next/link'
import * as Dialog from '@radix-ui/react-dialog'
import { Menu, X, ExternalLink } from 'lucide-react'
import { SignedIn, SignedOut } from '@clerk/nextjs'

export default function MobileNav() {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <div className="md:hidden">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            className="btn btn-ghost btn-sm"
            aria-label="Open navigation menu"
            style={{
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text)',
            }}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(33, 29, 26, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />

          <Dialog.Content
            aria-describedby={undefined}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '82%',
              maxWidth: 320,
              background: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-raised)',
              zIndex: 1001,
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 32,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <Dialog.Title
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--color-text)',
                    margin: 0,
                  }}
                >
                  <Link href="/" onClick={close} style={{ textDecoration: 'none', color: 'inherit' }}>
                    Pyr<span style={{ color: 'var(--color-accent)' }}>a</span>
                  </Link>
                </Dialog.Title>

                <Dialog.Close asChild>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      padding: 6,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    aria-label="Close navigation menu"
                  >
                    <X size={20} aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a
                  href="#features"
                  onClick={close}
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    padding: '8px 0',
                  }}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={close}
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    padding: '8px 0',
                  }}
                >
                  How it works
                </a>
                <a
                  href="#pricing"
                  onClick={close}
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    padding: '8px 0',
                  }}
                >
                  Pricing
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={close}
                  aria-label="Documentation (opens in a new tab)"
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: 'var(--color-text)',
                    padding: '8px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Docs
                  <ExternalLink size={14} aria-hidden="true" style={{ color: 'var(--color-text-muted)' }} />
                </a>
              </nav>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 20,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={close}
                  className="btn btn-secondary w-full"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  onClick={close}
                  className="btn btn-primary w-full"
                >
                  Get started free
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="btn btn-primary w-full"
                >
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
