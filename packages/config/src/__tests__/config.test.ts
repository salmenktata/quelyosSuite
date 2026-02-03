/**
 * Tests unitaires pour @quelyos/config
 */

import { describe, it, expect } from 'vitest';
import {
  PORTS,
  APPS,
  API,
  isQuelyosPort,
  getServiceByPort,
  getBackendUrl,
  getAppUrl,
  buildApiUrl,
  getProxiedImageUrl,
  isExternalService,
  TIMEOUTS,
  STORAGE_KEYS,
  ERROR_CODES,
} from '../index';

describe('PORTS', () => {
  it('devrait avoir tous les ports requis', () => {
    expect(PORTS.vitrine).toBe(3000);
    expect(PORTS.ecommerce).toBe(3001);
    expect(PORTS.dashboard).toBe(5175);
    expect(PORTS.superadmin).toBe(9000);
    expect(PORTS.backend).toBe(8069);
    expect(PORTS.postgres).toBe(5432);
    expect(PORTS.redis).toBe(6379);
  });

  it('devrait identifier les ports Quelyos', () => {
    expect(isQuelyosPort(3000)).toBe(true);
    expect(isQuelyosPort(8069)).toBe(true);
    expect(isQuelyosPort(9999)).toBe(false);
  });

  it('devrait récupérer le service par port', () => {
    expect(getServiceByPort(3000)).toBe('vitrine');
    expect(getServiceByPort(5175)).toBe('dashboard');
    expect(getServiceByPort(9999)).toBeNull();
  });
});

describe('APPS', () => {
  it('devrait avoir les URLs dev et prod pour toutes les apps', () => {
    expect(APPS.vitrine.dev).toContain('localhost:3000');
    expect(APPS.vitrine.prod).toBe('https://quelyos.com');

    expect(APPS.ecommerce.dev).toContain('localhost:3001');
    expect(APPS.ecommerce.prod).toBe('https://shop.quelyos.com');

    expect(APPS.dashboard.dev).toContain('localhost:5175');
    expect(APPS.dashboard.prod).toBe('https://backoffice.quelyos.com');

    expect(APPS.superadmin.dev).toContain('localhost:9000');
    expect(APPS.superadmin.prod).toBe('https://admin.quelyos.com');
  });

  it('devrait récupérer l\'URL selon l\'environnement', () => {
    expect(getAppUrl('vitrine', 'development')).toContain('localhost');
    expect(getAppUrl('vitrine', 'production')).toBe('https://quelyos.com');
  });
});

describe('API', () => {
  it('devrait avoir les URLs backend dev et prod', () => {
    expect(API.backend.dev).toContain('localhost:8069');
    expect(API.backend.prod).toBe('https://api.quelyos.com');
  });

  it('devrait récupérer l\'URL backend selon l\'environnement', () => {
    expect(getBackendUrl('development')).toContain('localhost:8069');
    expect(getBackendUrl('production')).toBe('https://api.quelyos.com');
  });

  it('devrait construire une URL API complète', () => {
    const url = buildApiUrl('/products', 'development');
    expect(url).toContain('localhost:8069');
    expect(url).toContain('/api/products');
  });

  it('devrait proxifier les URLs d\'images', () => {
    const imageUrl = '/web/image/product.template/123/image_1920';
    const proxied = getProxiedImageUrl(imageUrl, 'http://localhost:3001');
    expect(proxied).toBe('http://localhost:3001/web/image/product.template/123/image_1920');
  });

  it('ne devrait pas modifier les URLs déjà proxifiées', () => {
    const alreadyProxied = 'http://localhost:3001/web/image/product.template/123/image_1920';
    const result = getProxiedImageUrl(alreadyProxied);
    expect(result).toBe(alreadyProxied);
  });
});

describe('Services Externes', () => {
  it('devrait identifier les services externes', () => {
    expect(isExternalService('https://api.stripe.com/v1/charges')).toBe(true);
    expect(isExternalService('https://fonts.googleapis.com/css')).toBe(true);
    expect(isExternalService('https://api.unsplash.com/photos')).toBe(true);
    expect(isExternalService('https://localhost:8069/api/products')).toBe(false);
  });
});

describe('Constantes', () => {
  it('devrait avoir les timeouts définis', () => {
    expect(TIMEOUTS.API_REQUEST).toBe(30000);
    expect(TIMEOUTS.SEARCH_DEBOUNCE).toBe(300);
  });

  it('devrait avoir les clés localStorage définies', () => {
    expect(STORAGE_KEYS.AUTH_TOKEN).toBe('quelyos_auth_token');
    expect(STORAGE_KEYS.THEME).toBe('quelyos_theme');
  });

  it('devrait avoir les codes d\'erreur définis', () => {
    expect(ERROR_CODES.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
  });
});
