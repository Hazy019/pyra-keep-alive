// packages/shared/src/__tests__/safe-fetch.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { safeFetch, SafeFetchError } from '../safe-fetch'
import { SsrfError } from '../ssrf'

describe('safeFetch security controls', () => {
  it('TC_01 & TC_02: rejects blocked IP targets before sending any request', async () => {
    await expect(safeFetch('http://169.254.169.254/')).rejects.toThrow(SsrfError)
    await expect(safeFetch('http://127.0.0.1:8080/')).rejects.toThrow(SsrfError)
    await expect(safeFetch('http://[::1]/')).rejects.toThrow(SsrfError)
    await expect(safeFetch('http://[::ffff:a9fe:a9fe]/')).rejects.toThrow(SsrfError)
    await expect(safeFetch('http://10.0.0.1/')).rejects.toThrow(SsrfError)
  })

  it('TC_03: uses redirect: manual and treats 302 as non-success (ok: false)', async () => {
    const mockHeaders = new Headers({
      Location: 'http://169.254.169.254/latest/meta-data/',
    })
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 302,
      statusText: 'Found',
      headers: mockHeaders,
      body: (async function* () {
        yield Buffer.from('Redirecting...')
      })(),
    })

    const res = await safeFetch('http://example.com/test', {
      resolvedIps: ['93.184.216.34'],
      fetchFn: mockFetch as any,
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'http://example.com/test',
      expect.objectContaining({
        redirect: 'manual',
      }),
    )

    // Verify 302 is treated as non-success
    expect(res.status).toBe(302)
    expect(res.ok).toBe(false)
    expect(res.headers.get('Location')).toBe('http://169.254.169.254/latest/meta-data/')
  })

  it('TC_04: pins validated IP and returns pinnedIp in response', async () => {
    let capturedDispatcher: any = null
    const mockFetch = vi.fn().mockImplementation((_url: string, opts: any) => {
      capturedDispatcher = opts?.dispatcher
      return Promise.resolve({
        status: 200,
        statusText: 'OK',
        headers: new Headers(),
        body: null,
      })
    })

    const res = await safeFetch('http://example.com/ping', {
      resolvedIps: ['93.184.216.34'],
      fetchFn: mockFetch as any,
    })

    expect(res.pinnedIp).toBe('93.184.216.34')
    expect(capturedDispatcher).toBeDefined()
  })

  it('enforces response size cap and throws SafeFetchError when exceeded', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      body: (async function* () {
        yield Buffer.from('x'.repeat(200))
      })(),
    })

    await expect(
      safeFetch('http://example.com/huge', {
        resolvedIps: ['93.184.216.34'],
        maxResponseBytes: 100,
        fetchFn: mockFetch as any,
      }),
    ).rejects.toThrow(SafeFetchError)
  })

  it('enforces timeout on aborted request', async () => {
    const mockFetch = vi.fn().mockImplementation(async (_url, opts: any) => {
      return new Promise((_, reject) => {
        opts.signal.addEventListener('abort', () => {
          const err = new Error('The operation was aborted')
          err.name = 'AbortError'
          reject(err)
        })
      })
    })

    await expect(
      safeFetch('http://example.com/slow', {
        resolvedIps: ['93.184.216.34'],
        timeoutMs: 10,
        fetchFn: mockFetch as any,
      }),
    ).rejects.toThrow(/timed out/i)
  })
})
