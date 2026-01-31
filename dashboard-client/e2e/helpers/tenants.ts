/**
 * Helpers pour tests multi-tenant
 * 
 * Fonctions utilitaires pour tester l'isolation entre tenants
 */

import { Page, expect } from '@playwright/test'

export interface TenantConfig {
  id: number
  domain: string
  email: string
  password: string
  name: string
}

/**
 * Configuration des tenants de test
 * ATTENTION : Ces credentials doivent exister dans la DB de test
 */
export const TEST_TENANTS: Record<string, TenantConfig> = {
  tenant1: {
    id: 1,
    domain: 'tenant1.quelyos.local',
    email: 'admin@tenant1.com',
    password: 'test123',
    name: 'Tenant 1',
  },
  tenant2: {
    id: 2,
    domain: 'tenant2.quelyos.local',
    email: 'admin@tenant2.com',
    password: 'test123',
    name: 'Tenant 2',
  },
}

/**
 * Login en tant que tenant spécifique
 */
export async function loginAsTenant(
  page: Page,
  tenant: TenantConfig
): Promise<void> {
  await page.goto('/login')
  
  // Remplir formulaire login
  await page.fill('input[name="email"], input[type="email"]', tenant.email)
  await page.fill('input[name="password"], input[type="password"]', tenant.password)
  
  // Soumettre
  await page.click('button[type="submit"]')
  
  // Attendre redirection dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  
  // Vérifier localStorage contient tenant_id
  const storedTenantId = await page.evaluate(() => localStorage.getItem('tenant_id'))
  expect(storedTenantId).toBe(String(tenant.id))
}

/**
 * Login en tant que tenant1 (helper rapide)
 */
export async function loginAsTenant1(page: Page): Promise<void> {
  await loginAsTenant(page, TEST_TENANTS.tenant1)
}

/**
 * Login en tant que tenant2 (helper rapide)
 */
export async function loginAsTenant2(page: Page): Promise<void> {
  await loginAsTenant(page, TEST_TENANTS.tenant2)
}

/**
 * Récupérer le token JWT depuis localStorage
 */
export async function getAccessToken(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('access_token'))
}

/**
 * Récupérer le tenant_id depuis localStorage
 */
export async function getTenantId(page: Page): Promise<number | null> {
  const tenantIdStr = await page.evaluate(() => localStorage.getItem('tenant_id'))
  return tenantIdStr ? parseInt(tenantIdStr, 10) : null
}

/**
 * Logout et clear localStorage
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.goto('/login')
}

/**
 * Intercepter requête API et modifier header tenant
 * Permet de tester injection cross-tenant
 */
export async function interceptAndInjectTenantHeader(
  page: Page,
  endpoint: string,
  fakeTenantId: number
): Promise<Response> {
  const token = await getAccessToken(page)
  
  return page.evaluate(
    async ({ endpoint: ep, tenantId, token: tk }) => {
      const response = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': String(tenantId),
          'Authorization': `Bearer ${tk}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {},
          id: Math.random(),
        }),
      })
      
      return {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      }
    },
    { endpoint, tenantId: fakeTenantId, token }
  )
}

/**
 * Intercepter requête API et modifier body tenant_id
 */
export async function interceptAndInjectTenantBody(
  page: Page,
  endpoint: string,
  fakeTenantId: number
): Promise<Response> {
  const token = await getAccessToken(page)
  
  return page.evaluate(
    async ({ endpoint: ep, tenantId, token: tk }) => {
      const response = await fetch(ep, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tk}`,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: {
            tenant_id: tenantId, // ❌ Injection
          },
          id: Math.random(),
        }),
      })
      
      return {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      }
    },
    { endpoint, tenantId: fakeTenantId, token }
  )
}
