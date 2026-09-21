import type { NextConfig } from 'next'

// Suppress Node.js DEP0005 (Buffer() deprecation) emitted by internal pg/postgres drivers
if (typeof process !== 'undefined' && process.emitWarning) {
  const originalEmitWarning = process.emitWarning
  process.emitWarning = function (warning: any, ...args: any[]) {
    if (typeof warning === 'string' && (warning.includes('DEP0005') || warning.includes('Buffer() is deprecated'))) {
      return
    }
    if (typeof warning === 'object' && warning && (warning.code === 'DEP0005' || warning.name === 'DeprecationWarning' && warning.message?.includes('Buffer()'))) {
      return
    }
    return (originalEmitWarning as any).apply(process, [warning, ...args])
  }
}

const nextConfig: NextConfig = {
  // Strict mode catches React lifecycle issues earlier
  reactStrictMode: true,

  transpilePackages: ['@pyra/db', '@pyra/shared'],

  // Fast compilation by avoiding parsing huge barrel files (lucide-react)
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // TLS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // MIME sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy — deny camera/mic/geolocation by default
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // CSP — script-src uses nonce in practice; this is the base policy
          // In production, add your CDN domain to the allowlist
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.pyra.dev",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob: https://img.clerk.com",
              "connect-src 'self' https://clerk.pyra.dev https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com",
              "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
