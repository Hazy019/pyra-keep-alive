// packages/shared/src/__tests__/ssrf-blocklist.spec.ts
import { describe, it, expect } from 'vitest'
import { isBlockedIp } from '../ssrf'

const BLOCKED = [
  '::ffff:a9fe:a9fe',
  '::ffff:169.254.169.254',
  '::ffff:7f00:1',
  '::ffff:10.0.0.5',
  '100.100.100.200',
  '198.18.0.1',
  '169.254.169.254',
  '127.0.0.1',
  '::1',
  'fd00::1',
  '[::ffff:a9fe:a9fe]',
  '64:ff9b::a9fe:a9fe',
]
const ALLOWED = ['93.184.216.34', '1.1.1.1', '2606:4700:4700::1111']

describe('isBlockedIp', () => {
  it.each(BLOCKED)('blocks %s', (ip) => expect(isBlockedIp(ip)).toBe(true))
  it.each(ALLOWED)('allows %s', (ip) => expect(isBlockedIp(ip)).toBe(false))
  it('fails closed on non-IP input', () => expect(isBlockedIp('not-an-ip')).toBe(true))
})
