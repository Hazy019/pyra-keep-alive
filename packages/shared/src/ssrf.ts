/**
 * SSRF Protection — validates URLs before they are stored or pinged.
 *
 * Two layers:
 * 1. Structural check: blocks private/link-local/loopback CIDRs using node:net BlockList
 *    with IPv4-mapped IPv6 address unwrapping.
 * 2. DNS-pinning check: resolves the hostname and validates every resolved IP
 *    against the blocklist (prevents DNS-rebinding attacks).
 *
 * The same function is called at:
 *  a) Target creation time (API layer) — blocks bad URLs before they enter the DB.
 *  b) Ping time (worker) — re-validates because DNS can change between creation and execution.
 */

import { promises as dns } from 'node:dns'
import { BlockList, isIP } from 'node:net'

const bl = new BlockList()
for (const [net, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  bl.addSubnet(net, prefix, 'ipv4')
}

for (const [net, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['fc00::', 7],
  ['fe80::', 10],
  ['fec0::', 10],
  ['ff00::', 8],
  ['64:ff9b::', 96],
  ['2001:db8::', 32],
] as const) {
  bl.addSubnet(net, prefix, 'ipv6')
}

export function unwrapMapped(ip: string): string {
  const lower = ip.toLowerCase()
  const dotted = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (dotted) return dotted[1]!
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (hex) {
    const hi = parseInt(hex[1]!, 16)
    const lo = parseInt(hex[2]!, 16)
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`
  }
  return ip
}

export function isBlockedIp(raw: string): boolean {
  const ip = unwrapMapped(raw.replace(/^\[|\]$/g, ''))
  const family = isIP(ip)
  if (family === 0) return true // not an IP: fail closed
  return bl.check(ip, family === 4 ? 'ipv4' : 'ipv6')
}

/** All schemes allowed for target URLs */
const ALLOWED_SCHEMES = new Set(['http:', 'https:'])
/** Max URL length guard */
const MAX_URL_LENGTH = 2048

export class SsrfError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SsrfError'
  }
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
  const cleanHost = hostname.replace(/^\[|\]$/g, '')

  // 5. If hostname is a raw IP address (or bracketed IPv6/IPv4-mapped IP), validate it directly
  const unwrappedHost = unwrapMapped(cleanHost)
  if (isIP(cleanHost) !== 0 || isIP(unwrappedHost) !== 0) {
    if (isBlockedIp(cleanHost)) {
      throw new SsrfError(`IP address ${hostname} is in a blocked range`)
    }
    return { url: parsed, resolvedIps: [cleanHost] }
  }

  // 6. Block reserved/special hostnames
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new SsrfError('Localhost is not a valid target')
  }
  if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new SsrfError('Internal hostnames (.internal, .local) are not allowed')
  }

  // 7. DNS resolution — resolve4 + resolve6 explicitly to get IPs, not CNAME aliases.
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
      throw new SsrfError(`Hostname ${hostname} resolved to no addresses`)
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
