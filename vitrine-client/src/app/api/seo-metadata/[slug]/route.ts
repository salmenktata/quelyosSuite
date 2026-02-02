import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/backend-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const response = await fetch(`${BACKEND_URL}/api/ecommerce/seo-metadata/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      next: { revalidate: 3600 }, // Cache 1h
    })

    const data = await response.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Metadata non trouvé' },
      { status: 404 }
    )
  }
}
