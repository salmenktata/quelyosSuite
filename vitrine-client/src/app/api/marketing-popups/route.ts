import { NextRequest, NextResponse } from 'next/server'

const ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const page_path = body.page_path || '/'

    const response = await fetch(`${ODOO_URL}/api/ecommerce/popups/active`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_path }),
      next: { revalidate: 60 }, // Cache 1min
    })

    const data = await response.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    })
  } catch (error) {
    return NextResponse.json(
      { success: true, popups: [] },
      { status: 200 }
    )
  }
}
