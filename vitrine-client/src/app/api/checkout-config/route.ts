import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend-config'

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin') || ''

    const response = await fetch(`${BACKEND_URL}/api/ecommerce/checkout-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: origin }),
      next: { revalidate: 3600 }, // Cache 1h
    })

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(data, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Configuration non disponible' },
      { status: 500 }
    )
  }
}
