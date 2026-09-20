/**
 * Client-side CSRF Token Helper
 *
 * Implements the Double-Submit Cookie Pattern (VULN-002 defense).
 * Reads the `pyra-csrf` cookie value to send as the `x-csrf-token` header on state-changing API requests.
 * If the cookie hasn't been initialized yet by the server, it creates one client-side.
 */

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('pyra-csrf='))

  if (match) {
    const value = match.split('=')[1]
    if (value) return decodeURIComponent(value)
  }

  // Client-side initialization fallback if cookie hasn't arrived yet
  const token = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  document.cookie = `pyra-csrf=${token}; path=/; SameSite=Strict${isSecure ? '; Secure' : ''}`
  return token
}
