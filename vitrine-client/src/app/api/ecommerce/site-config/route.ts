/**
 * API Route: Site Configuration
 * Proxy vers l'endpoint backend /api/ecommerce/site-config
 * Utilise POST JSON-RPC car l'endpoint GET ne fonctionne pas correctement
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBackendApiUrl } from '@/lib/backend';
import { logger } from '@/lib/logger';

const BACKEND_URL = getBackendApiUrl();

// Configuration complète par défaut
const DEFAULT_CONFIG = {
  compare_enabled: true,
  wishlist_enabled: true,
  reviews_enabled: true,
  newsletter_enabled: true,
  whatsapp_number: '21600000000',
  contact_email: 'contact@quelyos.com',
  contact_phone: '+21600000000',
  shipping_standard_days: '2-5',
  shipping_express_days: '1-2',
  free_shipping_threshold: 150,
  return_delay_days: 30,
  refund_delay_days: '7-10',
  warranty_years: 2,
  payment_methods: ['Carte bancaire', 'Espèces', 'Virement', 'Mobile money'],
  customer_service_hours: '9h à 18h',
  customer_service_days: 'lundi au vendredi',
};

export async function GET(_request: NextRequest) {
  try {
    // Essayer d'abord la méthode GET (endpoint main.py)
    let response = await fetch(`${BACKEND_URL}/api/ecommerce/site-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    // Si GET échoue (405), essayer POST JSON-RPC (endpoint cms.py)
    if (!response.ok && response.status === 405) {
      response = await fetch(`${BACKEND_URL}/api/ecommerce/site-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {},
          id: Date.now(),
        }),
        cache: 'no-store',
      });
    }

    if (!response.ok) {
      logger.warn('Site config: backend returned', response.status);
      return NextResponse.json({
        success: true,
        data: DEFAULT_CONFIG,
      }, {
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    const rawData = await response.json();

    // Parser la réponse selon le format (GET direct ou POST JSON-RPC)
    let configData = DEFAULT_CONFIG;

    if (rawData.success && rawData.data) {
      // Format GET: { success: true, data: { ... } }
      configData = { ...DEFAULT_CONFIG, ...rawData.data };
    } else if (rawData.result?.success && rawData.result?.config) {
      // Format POST JSON-RPC: { result: { success: true, config: { ... } } }
      // Mapper le format imbriqué vers le format plat
      const cfg = rawData.result.config;
      configData = {
        ...DEFAULT_CONFIG,
        whatsapp_number: cfg.brand?.whatsapp || DEFAULT_CONFIG.whatsapp_number,
        contact_email: cfg.brand?.email || DEFAULT_CONFIG.contact_email,
        contact_phone: cfg.brand?.phone || DEFAULT_CONFIG.contact_phone,
        shipping_standard_days: cfg.shipping
          ? `${cfg.shipping.standardDaysMin || 2}-${cfg.shipping.standardDaysMax || 5}`
          : DEFAULT_CONFIG.shipping_standard_days,
        shipping_express_days: cfg.shipping
          ? `${cfg.shipping.expressDaysMin || 1}-${cfg.shipping.expressDaysMax || 2}`
          : DEFAULT_CONFIG.shipping_express_days,
        free_shipping_threshold: cfg.shipping?.freeThreshold || DEFAULT_CONFIG.free_shipping_threshold,
        return_delay_days: cfg.returns?.windowDays || DEFAULT_CONFIG.return_delay_days,
        refund_delay_days: cfg.returns
          ? `${cfg.returns.refundDaysMin || 7}-${cfg.returns.refundDaysMax || 10}`
          : DEFAULT_CONFIG.refund_delay_days,
        warranty_years: cfg.returns?.warrantyYears || DEFAULT_CONFIG.warranty_years,
        customer_service_hours: cfg.customerService
          ? `${cfg.customerService.hoursStart || 9}h à ${cfg.customerService.hoursEnd || 18}h`
          : DEFAULT_CONFIG.customer_service_hours,
        customer_service_days: cfg.customerService?.days || DEFAULT_CONFIG.customer_service_days,
        compare_enabled: cfg.features?.comparison ?? DEFAULT_CONFIG.compare_enabled,
        wishlist_enabled: cfg.features?.wishlist ?? DEFAULT_CONFIG.wishlist_enabled,
        reviews_enabled: cfg.features?.reviews ?? DEFAULT_CONFIG.reviews_enabled,
        newsletter_enabled: cfg.features?.newsletter ?? DEFAULT_CONFIG.newsletter_enabled,
      };
    }

    return NextResponse.json({
      success: true,
      data: configData,
    }, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  } catch (error) {
    logger.error('Site config error:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_CONFIG,
    }, {
      headers: { 'Cache-Control': 'public, max-age=60' },
    });
  }
}
