/**
 * Route API pour récupérer la config d'un tenant par son code.
 *
 * GET /api/tenant/[code]
 *
 * Proxy vers backend: GET /api/ecommerce/tenant/[code]
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const params = await context.params;
    const { code } = params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Code manquant' },
        { status: 400 }
      );
    }

    // Appel direct HTTP vers backend (pas JSON-RPC)
    const backendUrl = `${BACKEND_URL}/api/ecommerce/tenant/${code}`;

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Tenant non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.error('Tenant API error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
