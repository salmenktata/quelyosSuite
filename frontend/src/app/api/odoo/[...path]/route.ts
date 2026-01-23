/**
 * Next.js API Route Proxy to Odoo
 *
 * This proxies all requests to /api/odoo/* to the Odoo backend
 * Avoids CORS issues and keeps API configuration server-side
 */

import { NextRequest, NextResponse } from 'next/server';

const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:8069';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params in Next.js 15+
    const params = await context.params;

    // Reconstruct the Odoo endpoint path
    const odooPath = `/api/ecommerce/${params.path.join('/')}`;
    const body = await request.json();

    // Forward the request to Odoo with JSON-RPC format
    const response = await fetch(`${ODOO_URL}${odooPath}`, {
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
        { error: `Odoo returned ${response.status}` },
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

    // Return the result
    return NextResponse.json(data.result);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
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

    // Use POST internally (Odoo expects JSON-RPC POST)
    const odooPath = `/api/ecommerce/${params.path.join('/')}`;

    const response = await fetch(`${ODOO_URL}${odooPath}`, {
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
        { error: `Odoo returned ${response.status}` },
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

    return NextResponse.json(data.result);
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
