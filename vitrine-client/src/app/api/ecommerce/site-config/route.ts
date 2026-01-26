/**
 * API Route: Site Configuration
 * Proxy vers l'endpoint Odoo GET /api/ecommerce/site-config
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8069';

export async function GET(request: NextRequest) {
  try {
    // Appeler directement l'endpoint Odoo (type='http', méthode GET)
    const response = await fetch(`${BACKEND_URL}/api/ecommerce/site-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache de 5 minutes côté serveur
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      logger.error('Erreur lors de la récupération de la configuration du site:', response.status);
      // Retourner les valeurs par défaut en cas d'erreur
      return NextResponse.json({
        success: true,
        data: {
          compare_enabled: true,
          wishlist_enabled: true,
          reviews_enabled: true,
          newsletter_enabled: true,
        },
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération de la configuration du site:', error);

    // Retourner les valeurs par défaut en cas d'erreur
    return NextResponse.json({
      success: true,
      data: {
        compare_enabled: true,
        wishlist_enabled: true,
        reviews_enabled: true,
        newsletter_enabled: true,
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=60', // Cache plus court en cas d'erreur
      },
    });
  }
}
