import { NextRequest, NextResponse } from 'next/server'

const ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${ODOO_URL}/api/ecommerce/promo-messages`, {
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
        { success: true, messages: [] },
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
    console.error('Promo messages API error:', error)
    return NextResponse.json(
      { success: true, messages: [] },
      { status: 200 }
    )
  }
}
