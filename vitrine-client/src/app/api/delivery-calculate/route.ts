import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const origin = request.headers.get('origin') || ''

    const response = await fetch(`${BACKEND_URL}/api/ecommerce/delivery/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        domain: origin,
        carrier_id: body.carrier_id,
        zone_code: body.zone_code,
        order_amount: body.order_amount,
      }),
    })

    const data = await response.json()

    if (!data.success) {
      return NextResponse.json(data, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: 'Calcul impossible' },
      { status: 500 }
    )
  }
}
