import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { BACKEND_URL } from '@/lib/backend-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/ecommerce/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { email, name },
        id: 1,
      }),
    })

    const data = await response.json()

    if (data.error) {
      logger.error('Newsletter subscribe error:', data.error)
      return NextResponse.json(
        { success: false, error: data.error.message || 'Erreur lors de l\'inscription' },
        { status: 500 }
      )
    }

    const result = data.result || {}

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Erreur lors de l\'inscription' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Inscription réussie'
    })
  } catch (_error) {
    logger.error('Newsletter subscribe API error:', error)
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue' },
      { status: 500 }
    )
  }
}
