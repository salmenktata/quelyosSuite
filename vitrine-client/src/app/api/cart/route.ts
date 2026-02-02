/**
 * API Route Proxy pour le panier backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function GET(request: NextRequest) {
  try {
    // Récupérer les cookies pour la session
    const cookieHeader = request.headers.get('cookie') || '';

    // Appeler l'API backend
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: {},
        id: Date.now(),
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    // Retourner directement le result
    return NextResponse.json(data.result || data);

  } catch (_error) {
    logger.error('Cart API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart', cart: null },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie') || '';

    // Appeler l'API backend
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: body,
        id: Date.now(),
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data.result || data);

  } catch (_error) {
    logger.error('Cart API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}
