/**
 * API error handler — returns a standardized error envelope.
 * Full stack trace is NEVER sent to the client; logged server-side only.
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AuthError } from '@/lib/auth'
import { SsrfError } from '@pyra/shared/ssrf'
import { makeErrorEnvelope } from '@pyra/shared/types'

/** Maps error types to HTTP status codes and safe client messages */
export function handleApiError(err: unknown, correlationId: string): NextResponse {
  // Log full error server-side (never exposed to client)
  console.error(`[${correlationId}]`, err)

  if (err instanceof AuthError) {
    return NextResponse.json(
      makeErrorEnvelope(err.message, correlationId),
      { status: err.statusCode },
    )
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      makeErrorEnvelope(
        `Validation error: ${err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        correlationId,
      ),
      { status: 400 },
    )
  }

  if (err instanceof SsrfError) {
    return NextResponse.json(
      makeErrorEnvelope(`Invalid target URL: ${err.message}`, correlationId),
      { status: 400 },
    )
  }

  if (
    err instanceof Error &&
    'isApiError' in err &&
    'statusCode' in err &&
    typeof (err as { statusCode: unknown }).statusCode === 'number'
  ) {
    return NextResponse.json(
      makeErrorEnvelope(err.message, correlationId),
      { status: (err as { statusCode: number }).statusCode },
    )
  }

  // All other errors: generic message, full trace logged server-side
  return NextResponse.json(
    makeErrorEnvelope('An unexpected error occurred. Please try again.', correlationId),
    { status: 500 },
  )
}
