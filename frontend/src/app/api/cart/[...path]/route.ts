/**
 * API Route Proxy dynamique pour le panier Odoo
 * Gère tous les endpoints /api/cart/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:8069';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    // Await params (Next.js 14+ requirement)
    const { path } = await params;

    // Construire le chemin complet
    const pathString = path.join('/');
    const endpoint = `/api/ecommerce/cart/${pathString}`;

    // Appeler l'API Odoo
    const response = await fetch(`${ODOO_URL}${endpoint}`, {
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
      throw new Error(`Odoo API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.result || data);

  } catch (error) {
    logger.error('Cart API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const body = await request.json();
    const cookieHeader = request.headers.get('cookie') || '';

    // Await params (Next.js 14+ requirement)
    const { path } = await params;

    // Construire le chemin complet
    const pathString = path.join('/');
    const endpoint = `/api/ecommerce/cart/${pathString}`;

    // Appeler l'API Odoo
    const response = await fetch(`${ODOO_URL}${endpoint}`, {
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
      throw new Error(`Odoo API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.result || data);

  } catch (error) {
    logger.error('Cart API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update cart' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';

    // Await params (Next.js 14+ requirement)
    const { path } = await params;

    // Construire le chemin complet
    const pathString = path.join('/');
    const endpoint = `/api/ecommerce/cart/${pathString}`;

    // Appeler l'API Odoo
    const response = await fetch(`${ODOO_URL}${endpoint}`, {
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
      throw new Error(`Odoo API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data.result || data);

  } catch (error) {
    logger.error('Cart API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete from cart' },
      { status: 500 }
    );
  }
}
