/**
 * GET /api/health — minimal liveness endpoint
 * Returns only status; no internal details, no auth required.
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok' }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache',
    },
  })
}
