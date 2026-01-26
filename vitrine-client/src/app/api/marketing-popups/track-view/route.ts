import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8069'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const popup_id = body.popup_id

    await fetch(`${BACKEND_URL}/api/ecommerce/popups/${popup_id}/track-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
