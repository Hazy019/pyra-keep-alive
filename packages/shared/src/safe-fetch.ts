/**
 * Safe Outbound HTTP Fetcher with SSRF, DNS-pinning, and redirect protections.
 *
 * Guarantees:
 * 1. Target URL validation (SSRF blocklist via node:net BlockList).
 * 2. DNS resolution done once and pinned to undici Agent to prevent DNS rebinding.
 * 3. redirect: 'manual' to prevent redirects to private/internal targets.
 * 4. 3xx status codes treated as non-success (ok is strictly 200..299).
 * 5. Hard timeout enforcement.
 * 6. Hard response-size cap (default 1MB).
 */

import { Agent, fetch as undiciFetch } from 'undici'
import { validateTargetUrl, isBlockedIp, SsrfError } from './ssrf'

export interface SafeFetchOptions {
  method?: string
  headers?: Record<string, string> | Headers
  timeoutMs?: number
  maxResponseBytes?: number
  body?: string | Uint8Array | null
  signal?: AbortSignal
  resolvedIps?: string[]
  fetchFn?: typeof undiciFetch
}

export interface SafeFetchResponse {
  status: number
  statusText: string
  headers: Headers
  ok: boolean
  pinnedIp: string
  text: () => Promise<string>
  json: <T = unknown>() => Promise<T>
  arrayBuffer: () => Promise<ArrayBuffer>
}

export class SafeFetchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SafeFetchError'
  }
}

export async function safeFetch(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResponse> {
  const timeoutMs = options.timeoutMs ?? 10_000
  const maxResponseBytes = options.maxResponseBytes ?? 1_048_576 // 1MB

  let resolvedIps = options.resolvedIps
  let targetUrl: string = rawUrl

  if (!resolvedIps || resolvedIps.length === 0) {
    const validated = await validateTargetUrl(rawUrl)
    resolvedIps = validated.resolvedIps
    targetUrl = validated.url.toString()
  } else {
    // Validate provided resolved IPs against blocklist
    for (const ip of resolvedIps) {
      if (isBlockedIp(ip)) {
        throw new SsrfError(`Provided IP address is blocked: ${ip}`)
      }
    }
  }

  const pinnedIp = resolvedIps[0]!
  const isIpv6 = pinnedIp.includes(':')
  const ipFamily = isIpv6 ? 6 : 4

  const dispatcher = new Agent({
    connect: {
      lookup: (_hostname, opts, cb) => {
        if (opts && (opts as { all?: boolean }).all) {
          cb(null, [{ address: pinnedIp, family: ipFamily }])
        } else {
          cb(null, pinnedIp, ipFamily)
        }
      },
    },
  })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      controller.abort(options.signal?.reason)
    })
  }

  try {
    const reqHeaders: Record<string, string> = {}
    if (options.headers instanceof Headers) {
      options.headers.forEach((val, key) => {
        reqHeaders[key] = val
      })
    } else if (options.headers) {
      Object.assign(reqHeaders, options.headers)
    }

    const doFetch = options.fetchFn ?? undiciFetch
    const fetchInit: Parameters<typeof doFetch>[1] = {
      method: options.method ?? 'GET',
      headers: reqHeaders,
      redirect: 'manual',
      dispatcher,
      signal: controller.signal,
    }
    if (options.body != null) {
      fetchInit.body = options.body as any
    }

    const response = await doFetch(targetUrl, fetchInit)

    const status = response.status
    const statusText = response.statusText

    const resHeaders = new Headers()
    if (response.headers && typeof (response.headers as Headers).forEach === 'function') {
      ;(response.headers as Headers).forEach((val: string, key: string) => {
        resHeaders.append(key, val)
      })
    } else if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        if (Array.isArray(value)) {
          for (const v of value) resHeaders.append(key, v)
        } else if (value !== undefined) {
          resHeaders.set(key, String(value))
        }
      }
    }

    // Check Content-Length guard
    const cl = resHeaders.get('content-length')
    if (cl && parseInt(cl, 10) > maxResponseBytes) {
      throw new SafeFetchError(
        `Response Content-Length ${cl} exceeds maximum allowed size of ${maxResponseBytes} bytes`,
      )
    }

    // Stream and cap response body
    let bodyBuffer = Buffer.alloc(0)
    if (response.body) {
      const chunks: Buffer[] = []
      let totalBytes = 0
      for await (const chunk of response.body as AsyncIterable<Uint8Array | Buffer>) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        totalBytes += buf.length
        if (totalBytes > maxResponseBytes) {
          throw new SafeFetchError(
            `Response size exceeded maximum allowed size of ${maxResponseBytes} bytes`,
          )
        }
        chunks.push(buf)
      }
      bodyBuffer = Buffer.concat(chunks)
    }

    // 3xx status treated as non-success (ok is strictly 200..299)
    const ok = status >= 200 && status < 300

    return {
      status,
      statusText,
      headers: resHeaders,
      ok,
      pinnedIp,
      text: async () => bodyBuffer.toString('utf-8'),
      json: async <T = unknown>() => JSON.parse(bodyBuffer.toString('utf-8')) as T,
      arrayBuffer: async () =>
        bodyBuffer.buffer.slice(bodyBuffer.byteOffset, bodyBuffer.byteOffset + bodyBuffer.byteLength),
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError' && controller.signal.aborted) {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
    await dispatcher.destroy().catch(() => {})
  }
}
