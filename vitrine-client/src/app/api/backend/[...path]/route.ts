/**
 * Next.js API Route Proxy to Backend
 *
 * This proxies all requests to /api/backend/* to the backend system
 * Avoids CORS issues and keeps API configuration server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { anonymizeResponse, shouldAnonymize } from '@/lib/api-anonymizer';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15+
    const params = await context.params;

    // Reconstruct the backend endpoint path
    const backendPath = `/api/ecommerce/${params.path.join('/')}`;
    const body = await request.json();

    // Forward the request to backend with JSON-RPC format
    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: body,
        id: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Handle JSON-RPC errors
    if (data.error) {
      return NextResponse.json(
        { error: data.error.data?.message || data.error.message },
        { status: 400 }
      );
    }

    // Return the result with anonymization
    const rawResult = data.result !== undefined ? data.result : data;
    const result = shouldAnonymize(backendPath) ? anonymizeResponse(rawResult) : rawResult;

    return NextResponse.json(result);
  } catch (_error: unknown) {
    logger.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Support GET requests for read-only endpoints
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15+
    const params = await context.params;

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Use POST internally (backend expects JSON-RPC POST)
    const backendPath = `/api/ecommerce/${params.path.join('/')}`;

    const response = await fetch(`${BACKEND_URL}${backendPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: queryParams,
        id: Math.floor(Math.random() * 1000000),
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Backend error ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.error) {
      return NextResponse.json(
        { error: data.error.data?.message || data.error.message },
        { status: 400 }
      );
    }

    // Return the result with anonymization
    const rawResult = data.result !== undefined ? data.result : data;
    const result = shouldAnonymize(backendPath) ? anonymizeResponse(rawResult) : rawResult;

    return NextResponse.json(result);
  } catch (_error: unknown) {
    logger.error('Proxy error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
