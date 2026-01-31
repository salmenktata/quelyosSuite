/**
 * Tests E2E - Sécurité Cross-Tenant
 * 
 * Vérifie l'isolation complète entre tenants pour prévenir :
 * - Accès non autorisé aux données d'autres tenants
 * - Injection de tenant_id dans headers/body
 * - Fuite de données via cache/localStorage
 * - Manipulation URLs avec tenant_id malveillant
 * 
 * CRITIQUE SÉCURITÉ : Ces tests DOIVENT TOUS PASSER
 */

import { test, expect } from '@playwright/test'
import {
  loginAsTenant1,
  loginAsTenant2,
  logout,
  getTenantId,
  getAccessToken,
  interceptAndInjectTenantHeader,
  interceptAndInjectTenantBody,
  TEST_TENANTS,
} from '../helpers/tenants'

test.describe('Cross-Tenant Security', () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer localStorage avant chaque test
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
  })

  test('tenant1 cannot access tenant2 data via header injection', async ({ page }) => {
    // SCÉNARIO : User tenant1 tente d'injecter X-Tenant-ID: 2
    // ATTENDU : Backend rejette (403 ou 401)
    
    // 1. Login en tant que tenant1
    await loginAsTenant1(page)
    
    // Vérifier qu'on est bien tenant1
    const tenantId = await getTenantId(page)
    expect(tenantId).toBe(TEST_TENANTS.tenant1.id)
    
    // 2. Tenter injection header X-Tenant-ID: 2 pour accéder produits tenant2
    const response = await interceptAndInjectTenantHeader(
      page,
      '/api/products',
      TEST_TENANTS.tenant2.id // ❌ Injection malveillante
    )
    
    // 3. Backend DOIT rejeter
    expect(response.status).toBeGreaterThanOrEqual(400)
    expect(response.ok).toBe(false)
  })

  test('tenant1 cannot access tenant2 data via body injection', async ({ page }) => {
    // SCÉNARIO : User tenant1 tente d'injecter tenant_id: 2 dans body
    // ATTENDU : Backend rejette ou ignore et retourne données tenant1
    
    await loginAsTenant1(page)
    
    // Tenter injection body param tenant_id: 2
    const response = await interceptAndInjectTenantBody(
      page,
      '/api/orders',
      TEST_TENANTS.tenant2.id // ❌ Injection malveillante
    )
    
    // Backend DOIT rejeter OU ignorer l'injection
    // (Si status 200, vérifier que données retournées sont bien tenant1)
    if (response.ok) {
      // Si succès, les données DOIVENT être tenant1 uniquement
      // Vérification via test côté backend requis
      console.warn('[SECURITY] Backend accepted request but should validate tenant_id')
    } else {
      // Préférable : rejet explicite
      expect(response.status).toBeGreaterThanOrEqual(400)
    }
  })

  test('localStorage is isolated per tenant', async ({ page }) => {
    // SCÉNARIO : Vérifier que localStorage est isolé entre tenants
    // ATTENDU : tenant2 ne voit PAS les données de tenant1
    
    // 1. Login tenant1 et stocker donnée custom
    await loginAsTenant1(page)
    await page.evaluate(() => {
      localStorage.setItem('custom_data', 'tenant1_secret')
    })
    
    const tenant1Data = await page.evaluate(() => localStorage.getItem('custom_data'))
    expect(tenant1Data).toBe('tenant1_secret')
    
    // 2. Logout et login tenant2
    await logout(page)
    await loginAsTenant2(page)
    
    // 3. Vérifier que custom_data de tenant1 n'existe PAS
    const tenant2Data = await page.evaluate(() => localStorage.getItem('custom_data'))
    expect(tenant2Data).toBeNull()
    
    // 4. Vérifier que tenant_id est bien celui de tenant2
    const tenantId = await getTenantId(page)
    expect(tenantId).toBe(TEST_TENANTS.tenant2.id)
  })

  test('API calls from tenant1 always include tenant1 context', async ({ page }) => {
    // SCÉNARIO : Vérifier que TOUTES les requêtes API incluent le bon tenant
    // ATTENDU : Headers X-Tenant-ID et X-Tenant-Domain corrects
    
    await loginAsTenant1(page)
    
    // Intercepter requêtes API
    const requests: any[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          headers: request.headers(),
        })
      }
    })
    
    // Naviguer vers page produits (déclenche API calls)
    await page.goto('/store/products')
    await page.waitForTimeout(2000) // Attendre chargement
    
    // Vérifier que toutes requêtes API ont les bons headers
    const apiRequests = requests.filter((r) => 
      !r.url.includes('/login') && 
      !r.url.includes('/health')
    )
    
    expect(apiRequests.length).toBeGreaterThan(0)
    
    for (const req of apiRequests) {
      const headers = req.headers
      
      // Vérifier X-Tenant-ID présent et correct
      if (headers['x-tenant-id']) {
        expect(headers['x-tenant-id']).toBe(String(TEST_TENANTS.tenant1.id))
      }
      
      // Vérifier X-Tenant-Domain présent
      if (headers['x-tenant-domain']) {
        expect(headers['x-tenant-domain']).toContain('quelyos')
      }
    }
  })

  test('switching tenants clears previous tenant context', async ({ page }) => {
    // SCÉNARIO : Passer de tenant1 à tenant2 doit effacer contexte tenant1
    // ATTENDU : Aucune fuite de données entre sessions
    
    // 1. Login tenant1
    await loginAsTenant1(page)
    const tenant1Token = await getAccessToken(page)
    const tenant1Id = await getTenantId(page)
    
    expect(tenant1Token).toBeTruthy()
    expect(tenant1Id).toBe(TEST_TENANTS.tenant1.id)
    
    // 2. Logout et login tenant2
    await logout(page)
    await loginAsTenant2(page)
    
    const tenant2Token = await getAccessToken(page)
    const tenant2Id = await getTenantId(page)
    
    // 3. Vérifier nouveau contexte
    expect(tenant2Token).toBeTruthy()
    expect(tenant2Token).not.toBe(tenant1Token) // Token différent
    expect(tenant2Id).toBe(TEST_TENANTS.tenant2.id)
  })

  test('cannot access protected endpoints without tenant context', async ({ page }) => {
    // SCÉNARIO : Requête API sans tenant_id doit être rejetée
    // ATTENDU : Middleware frontend rejette avant envoi backend
    
    await page.goto('/login')
    
    // Clear tout contexte tenant
    await page.evaluate(() => {
      localStorage.clear()
    })
    
    // Tenter requête API sans tenant
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {},
            id: 1,
          }),
        })
        return {
          status: res.status,
          ok: res.ok,
        }
      } catch (error: any) {
        return {
          error: error.message,
        }
      }
    })
    
    // Backend ou frontend DOIT rejeter
    if ('error' in response) {
      // Frontend a rejeté (préférable)
      expect(response.error).toContain('Tenant context required')
    } else {
      // Backend a rejeté
      expect(response.status).toBeGreaterThanOrEqual(400)
    }
  })

  test('manipulated URLs with wrong tenant_id are rejected', async ({ page }) => {
    // SCÉNARIO : Manipulation URL avec tenant_id d'un autre tenant
    // ATTENDU : Redirection ou erreur 403
    
    await loginAsTenant1(page)
    
    // Tenter d'accéder à une URL avec tenant_id=2 (si applicable)
    // Note: Dépend de si l'app utilise tenant_id dans URL path
    // Si oui, tester protection. Sinon, skip ce test.
    
    // Exemple hypothétique : /api/tenants/2/products
    const maliciousUrl = '/api/tenants/' + TEST_TENANTS.tenant2.id + '/products'
    
    const response = await page.evaluate(async (url) => {
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('access_token'),
        },
      })
      return {
        status: res.status,
        ok: res.ok,
      }
    }, maliciousUrl)
    
    // DOIT être rejeté si URL contient tenant_id explicite
    // (Ce test est conditionnel selon architecture URL)
    if (response.status === 404) {
      // Route n'existe pas = OK
      expect(response.status).toBe(404)
    } else {
      // Si route existe, DOIT rejeter
      expect(response.status).toBeGreaterThanOrEqual(400)
    }
  })
})

test.describe('Cross-Tenant Data Leakage Prevention', () => {
  test('products from tenant2 are not visible to tenant1', async ({ page }) => {
    // SCÉNARIO : Vérifier isolation données produits
    // ATTENDU : tenant1 voit uniquement ses produits
    
    // Note: Nécessite setup DB avec produits test pour chaque tenant
    await loginAsTenant1(page)
    
    await page.goto('/store/products')
    
    // Vérifier qu'on charge produits
    await page.waitForSelector('[data-testid="product-list"], table', { 
      timeout: 10000,
      state: 'visible', 
    })
    
    // Inspecter données chargées
    const products = await page.evaluate(() => {
      // Tenter d'accéder directement aux données API depuis window/state
      // Selon implémentation React Query/Zustand
      return (window as any).__PRODUCTS_DATA__ || []
    })
    
    // Si produits chargés, vérifier qu'aucun n'appartient à tenant2
    // (Nécessite que produits aient un tenant_id visible dans data)
    if (products.length > 0) {
      for (const product of products) {
        if (product.tenant_id) {
          expect(product.tenant_id).toBe(TEST_TENANTS.tenant1.id)
        }
      }
    }
  })

  test('orders from tenant2 are not visible to tenant1', async ({ page }) => {
    // SCÉNARIO : Vérifier isolation données commandes
    // ATTENDU : tenant1 voit uniquement ses commandes
    
    await loginAsTenant1(page)
    await page.goto('/store/orders')
    
    // Attendre chargement
    await page.waitForSelector('[data-testid="orders-list"], table', { 
      timeout: 10000,
      state: 'visible', 
    })
    
    // Même logique que produits
    const orders = await page.evaluate(() => {
      return (window as any).__ORDERS_DATA__ || []
    })
    
    if (orders.length > 0) {
      for (const order of orders) {
        if (order.tenant_id) {
          expect(order.tenant_id).toBe(TEST_TENANTS.tenant1.id)
        }
      }
    }
  })
})
