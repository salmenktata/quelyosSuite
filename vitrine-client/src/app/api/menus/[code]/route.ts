import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8069'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    const response = await fetch(`${BACKEND_URL}/api/ecommerce/menus/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: 1,
      }),
      next: { revalidate: 600 }, // Cache 10min (menus changent rarement)
    })

    const data = await response.json()

    if (data.error || !data.result) {
      return NextResponse.json(
        { success: true, menu: null },
        { status: 200, headers: { 'Cache-Control': 'public, max-age=600' } }
      )
    }

    return NextResponse.json(data.result, {
      headers: { 'Cache-Control': 'public, max-age=600' },
    })
  } catch (error) {
    return NextResponse.json({ success: true, menu: null }, { status: 200 })
  }
}
