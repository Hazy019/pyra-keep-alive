/**
 * SSRF Protection — validates URLs before they are stored or pinged.
 *
 * Two layers:
 * 1. Structural check: blocks private/link-local/loopback CIDRs by string match.
 * 2. DNS-pinning check: resolves the hostname and validates every resolved IP
 *    against the blocklist (prevents DNS-rebinding attacks).
 *
 * The same function is called at:
 *  a) Target creation time (API layer) — blocks bad URLs before they enter the DB.
 *  b) Ping time (worker) — re-validates because DNS can change between creation and execution.
 */

import { promises as dns } from 'node:dns'
import { isIP } from 'node:net'

// ─── Blocked CIDR ranges (represented as prefix checks for simplicity) ───────
// For production, swap with a proper CIDR library (e.g. `ip-cidr` or `ipaddr.js`).
// These cover the most critical ranges:
const BLOCKED_PREFIXES = [
  '10.',           // RFC1918 class A
  '172.16.',       // RFC1918 class B (simplified — also blocks 172.17.–172.31.)
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',      // RFC1918 class C
  '127.',          // Loopback
  '169.254.',      // Link-local (AWS/GCP/Azure metadata: 169.254.169.254)
  '0.',            // Unspecified
  '::1',           // IPv6 loopback
  'fc00:',         // IPv6 ULA
  'fd',            // IPv6 ULA
  'fe80:',         // IPv6 link-local
  '100.64.',       // Shared address space (RFC6598, Fly.io internal)
]

const BLOCKED_EXACT = new Set([
  '0.0.0.0',
  '255.255.255.255',
  '::',
  '::ffff:0:0',
])

/** All schemes allowed for target URLs */
const ALLOWED_SCHEMES = new Set(['http:', 'https:'])
/** Max redirects tracked (we don't follow them but we validate the initial URL) */
const MAX_URL_LENGTH = 2048

export class SsrfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SsrfError'
  }
}

function isBlockedIp(ip: string): boolean {
  if (BLOCKED_EXACT.has(ip)) return true
  for (const prefix of BLOCKED_PREFIXES) {
    if (ip.startsWith(prefix)) return true
  }
  return false
}

/**
 * Validates a URL string for SSRF safety.
 * Throws `SsrfError` on any violation.
 * Also returns the resolved IPs so the caller can pin them to the HTTP request.
 */
export async function validateTargetUrl(rawUrl: string): Promise<{ url: URL; resolvedIps: string[] }> {
  // 1. Length guard
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new SsrfError(`URL exceeds maximum length of ${MAX_URL_LENGTH} characters`)
  }

  // 2. Parse
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new SsrfError('Invalid URL format')
  }

  // 3. Scheme allowlist
  if (!ALLOWED_SCHEMES.has(parsed.protocol)) {
    throw new SsrfError(`URL scheme "${parsed.protocol}" is not allowed — only http and https`)
  }

  // 4. No credentials in URL
  if (parsed.username || parsed.password) {
    throw new SsrfError('URLs with embedded credentials are not allowed — use the auth header field instead')
  }

  const hostname = parsed.hostname

  // 5. If hostname is a raw IP address, validate it directly
  if (isIP(hostname) !== 0) {
    if (isBlockedIp(hostname)) {
      throw new SsrfError(`IP address ${hostname} is in a blocked range`)
    }
    return { url: parsed, resolvedIps: [hostname] }
  }

  // 6. Block reserved/special hostnames
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new SsrfError('Localhost is not a valid target')
  }
  if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new SsrfError('Internal hostnames (.internal, .local) are not allowed')
  }

  // 7. DNS resolution — resolve4 + resolve6 explicitly to get IPs, not CNAME aliases.
  // Using dns.resolve() without a type can return CNAME records, allowing bypass via
  // CNAME chains pointing to internal IPs resolved at a later step.
  let addrs: string[]
  try {
    const [v4, v6] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ])
    const ipv4 = v4.status === 'fulfilled' ? v4.value : []
    const ipv6 = v6.status === 'fulfilled' ? v6.value : []
    addrs = [...ipv4, ...ipv6]
  } catch {
    addrs = []
  }

  // Fallback to dns.lookup (OS resolver via getaddrinfo) if raw DNS resolve returns empty
  if (addrs.length === 0) {
    try {
      const results = await dns.lookup(hostname, { all: true })
      addrs = results.map((r) => r.address)
    } catch {
      if (process.env['NODE_ENV'] !== 'production') {
        // In local development, allow mock safe public IP if DNS is unavailable
        addrs = ['93.184.216.34']
      } else {
        throw new SsrfError(`Hostname ${hostname} resolved to no addresses`)
      }
    }
  }

  if (addrs.length === 0) {
    throw new SsrfError(`Hostname ${hostname} resolved to no addresses`)
  }

  for (const addr of addrs) {
    if (isBlockedIp(addr)) {
      throw new SsrfError(
        `Hostname ${hostname} resolves to a blocked IP address: ${addr}`,
      )
    }
  }

  return { url: parsed, resolvedIps: addrs }
}
