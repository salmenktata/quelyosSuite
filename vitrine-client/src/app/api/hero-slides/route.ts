import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { getBackendUrl } from '@quelyos/config'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || getBackendUrl('development')

export async function GET(_request: NextRequest) {
  try {
    logger.debug('Hero slides: fetching from backend', { url: `${BACKEND_URL}/api/ecommerce/hero-slides` })
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/hero-slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1,
      }),
      cache: 'no-store', // Désactiver cache pour débogage
    })

    const data = await response.json()
    logger.debug('Hero slides: response received', {
      status: response.status,
      hasResult: !!data.result,
      hasError: !!data.error,
      slidesCount: data.result?.slides?.length
    })

    // Si erreur backend ou format JSON-RPC
    if (data.error || !data.result) {
      logger.warn('Hero slides: no result or error', { hasError: !!data.error, hasResult: !!data.result })
      return NextResponse.json(
        { success: true, slides: [] }, // Fallback gracieux
        {
          status: 200,
          headers: { 'Cache-Control': 'public, max-age=300' },
        }
      )
    }

    return NextResponse.json(data.result, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  } catch (error) {
    logger.error('Hero slides API error:', error)
    return NextResponse.json(
      { success: true, slides: [] }, // Fallback gracieux
      { status: 200 }
    )
  }
}
