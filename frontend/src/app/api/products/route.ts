/**
 * API Route Proxy pour les produits Odoo
 * Proxie les requêtes vers l'API Odoo
 */

import { NextRequest, NextResponse } from 'next/server';

const ODOO_URL = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:8069';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Construire les paramètres pour Odoo
    const params: any = {};

    if (searchParams.get('category_id')) {
      params.category_id = parseInt(searchParams.get('category_id')!);
    }
    if (searchParams.get('search')) {
      params.search = searchParams.get('search');
    }
    if (searchParams.get('price_min')) {
      params.price_min = parseFloat(searchParams.get('price_min')!);
    }
    if (searchParams.get('price_max')) {
      params.price_max = parseFloat(searchParams.get('price_max')!);
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
    }
    if (searchParams.get('sort')) {
      params.sort = searchParams.get('sort');
    }

    // Appeler l'API Odoo
    const response = await fetch(`${ODOO_URL}/api/ecommerce/products`, {
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
      throw new Error(`Odoo API error: ${response.status}`);
    }

    const data = await response.json();

    // Retourner directement le result
    return NextResponse.json(data.result || data);

  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
