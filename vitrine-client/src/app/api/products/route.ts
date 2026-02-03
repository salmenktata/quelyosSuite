/**
 * API Route Proxy pour les produits backend
 * Proxie les requêtes vers l'API backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getBackendApiUrl } from '@/lib/backend';

const BACKEND_URL = getBackendApiUrl();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Construire les paramètres pour le backend
    const params: Record<string, string | number | boolean> = {};

    if (searchParams.get('category_id')) {
      params.category_id = parseInt(searchParams.get('category_id')!);
    }
      if (searchParams.get('search')) {
        const search = searchParams.get('search');
        if (search) params.search = search;
      }
    if (searchParams.get('min_price')) {
      params.min_price = parseFloat(searchParams.get('min_price')!);
    }
    if (searchParams.get('max_price')) {
      params.max_price = parseFloat(searchParams.get('max_price')!);
    }
    if (searchParams.get('is_featured')) {
      params.is_featured = searchParams.get('is_featured') === 'true';
    }
    if (searchParams.get('is_new')) {
      params.is_new = searchParams.get('is_new') === 'true';
    }
    if (searchParams.get('is_bestseller')) {
      params.is_bestseller = searchParams.get('is_bestseller') === 'true';
    }
    if (searchParams.get('limit')) {
      params.limit = parseInt(searchParams.get('limit')!);
    }
    if (searchParams.get('offset')) {
      params.offset = parseInt(searchParams.get('offset')!);
      if (searchParams.get('sort')) {
        const sort = searchParams.get('sort');
        if (sort) params.sort = sort;
      }
    }

    // Appeler l'API backend
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: params,
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

  } catch (error) {
    logger.error('Products API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
