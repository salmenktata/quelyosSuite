import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * API Route Proxy pour Finance
 * Redirige toutes les requêtes vers l'app Finance
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const financeUrl = process.env.NEXT_PUBLIC_FINANCE_APP_URL || 'http://localhost:5175';
  const { path: pathSegments } = await params;
  const path = pathSegments?.join('/') || '';
  const targetUrl = `${financeUrl}/${path}${request.nextUrl.search}`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers),
      },
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    logger.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const financeUrl = process.env.NEXT_PUBLIC_FINANCE_APP_URL || 'http://localhost:5175';
  const { path: pathSegments } = await params;
  const path = pathSegments?.join('/') || '';
  const targetUrl = `${financeUrl}/${path}${request.nextUrl.search}`;

  try {
    const body = await request.text();

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers),
      },
      body,
    });

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    logger.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    );
  }
}
