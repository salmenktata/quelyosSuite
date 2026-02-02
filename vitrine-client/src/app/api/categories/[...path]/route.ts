/**
 * API Route Proxy dynamique pour les catégories backend
 * Gère tous les endpoints /api/categories/*
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Await params (Next.js 14+ requirement)
    const { path } = await params;

    // Construire le chemin complet
    const pathString = path.join('/');
    const endpoint = `/api/ecommerce/categories/${pathString}`;

    // Construire les paramètres
    const requestParams: any = {};
    searchParams.forEach((value, key) => {
      requestParams[key] = value;
    });

    // Appeler l'API backend
    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: requestParams,
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
    logger.error('Categories API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return GET(request, { params });
}
