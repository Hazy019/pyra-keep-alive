import { describe, it, expect } from 'vitest'
import { buildPingHeaders, normalizePingUrl } from '../worker.js'

describe('Worker Supabase & Header Normalization', () => {
  const supabaseUrl = 'https://yovijgatrnrjybimemfh.supabase.co'
  const mockAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenPayload12345'

  describe('normalizePingUrl', () => {
    it('appends /rest/v1/ to bare Supabase project URL', () => {
      expect(normalizePingUrl(supabaseUrl)).toBe('https://yovijgatrnrjybimemfh.supabase.co/rest/v1/')
    })

    it('appends /rest/v1/ when URL ends with trailing slash', () => {
      expect(normalizePingUrl(`${supabaseUrl}/`)).toBe('https://yovijgatrnrjybimemfh.supabase.co/rest/v1/')
    })

    it('preserves specific Supabase paths', () => {
      const customPath = `${supabaseUrl}/rest/v1/users?select=count`
      expect(normalizePingUrl(customPath)).toBe(customPath)
    })

    it('leaves standard non-supabase URLs untouched', () => {
      const normalUrl = 'https://client-echo-web.vercel.app/api/health'
      expect(normalizePingUrl(normalUrl)).toBe(normalUrl)
    })
  })

  describe('buildPingHeaders', () => {
    it('sets apikey and Authorization Bearer for Supabase URL with raw anon key', () => {
      const headers = buildPingHeaders(supabaseUrl, mockAnonKey)

      expect(headers['User-Agent']).toContain('Pyra-KeepAlive')
      expect(headers['Accept']).toBe('application/json')
      expect(headers['apikey']).toBe(mockAnonKey)
      expect(headers['Authorization']).toBe(`Bearer ${mockAnonKey}`)
    })

    it('handles Supabase URL when user prefixes anon key with "Bearer "', () => {
      const headers = buildPingHeaders(supabaseUrl, `Bearer ${mockAnonKey}`)

      expect(headers['apikey']).toBe(mockAnonKey)
      expect(headers['Authorization']).toBe(`Bearer ${mockAnonKey}`)
    })

    it('sets apikey and Authorization Bearer when JWT token is provided for custom domain', () => {
      const headers = buildPingHeaders('https://client-echo-web.vercel.app/api/ping', mockAnonKey)

      expect(headers['apikey']).toBe(mockAnonKey)
      expect(headers['Authorization']).toBe(`Bearer ${mockAnonKey}`)
    })

    it('handles non-JWT standard auth headers cleanly', () => {
      const headers = buildPingHeaders('https://api.example.com/health', 'secret_token_123')

      expect(headers['Authorization']).toBe('Bearer secret_token_123')
      expect(headers['apikey']).toBeUndefined()
    })

    it('preserves existing Basic auth scheme', () => {
      const headers = buildPingHeaders('https://api.example.com/health', 'Basic dXNlcjpwYXNz')

      expect(headers['Authorization']).toBe('Basic dXNlcjpwYXNz')
      expect(headers['apikey']).toBeUndefined()
    })

    it('returns default headers when no auth header is provided', () => {
      const headers = buildPingHeaders('https://api.example.com/health', null)

      expect(headers['User-Agent']).toContain('Pyra-KeepAlive')
      expect(headers['Authorization']).toBeUndefined()
      expect(headers['apikey']).toBeUndefined()
    })
  })
})
