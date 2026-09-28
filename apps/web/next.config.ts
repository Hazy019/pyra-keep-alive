import type { NextConfig } from 'next'

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
          // Cross-Origin Isolation
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          // Permissions policy — deny camera/mic/geolocation by default
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
