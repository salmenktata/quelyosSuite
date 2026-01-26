import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8069'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/hero-slides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1,
      }),
      next: { revalidate: 300 }, // Cache 5min
    })

    const data = await response.json()

    // Si erreur Odoo ou format JSON-RPC
    if (data.error || !data.result) {
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
