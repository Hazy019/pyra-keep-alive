import { test, expect } from '@playwright/test'

test('production headers are strict', async ({ request }) => {
  const res = await request.get('/')
  expect(res.status()).toBe(200)
  const h = res.headers()
  expect(h['strict-transport-security']).toMatch(/max-age=\d{7,}/)
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['x-content-type-options']).toBe('nosniff')
  const csp = h['content-security-policy'] ?? ''
  expect(csp).not.toContain("'unsafe-eval'")
  expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/)
})

test('unauthenticated API access is rejected', async ({ request }) => {
  for (const path of ['/api/targets', '/api/team/invite']) {
    const res = await request.get(path)
    expect([401, 403, 405]).toContain(res.status())
    expect(await res.text()).not.toMatch(/at .*\.(ts|js):\d+/) // no stack traces
  }
})
