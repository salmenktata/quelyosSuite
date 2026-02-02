import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { BACKEND_URL } from '@/lib/backend-config'

export async function GET(_request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/trust-badges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1,
      }),
      next: { revalidate: 300 },
    })

    const data = await response.json()

    if (data.error || !data.result) {
      return NextResponse.json(
        { success: true, badges: [] },
        {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=300' },
        }
      )
    }

    return NextResponse.json(data.result, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch (_error) {
    logger.error('Trust badges API error:', error)
    return NextResponse.json(
      { success: true, badges: [] },
      { status: 200 }
    )
  }
}
