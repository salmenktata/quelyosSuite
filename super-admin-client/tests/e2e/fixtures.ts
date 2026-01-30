/**
 * Fixtures Playwright pour tests E2E Super Admin
 *
 * Fournit des helpers réutilisables :
 * - Page authentifiée (bypass DEV mode ou login réel)
 * - Données de test
 * - Helpers de navigation
 */

import { test as base, expect, Page } from '@playwright/test'

// Types pour les fixtures
interface TestFixtures {
  authenticatedPage: Page
}

/**
 * Test avec page pré-authentifiée
 * En mode DEV, l'auth est désactivée donc on navigue directement
 * En mode PROD, on effectuerait un vrai login
 */
export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // En mode DEV, naviguer directement vers le dashboard
    await page.goto('/dashboard')

    // Attendre que la page soit chargée
    await page.waitForLoadState('networkidle')

    // Vérifier qu'on est bien sur le dashboard (mode DEV)
    // ou rediriger vers login si auth requise
    const url = page.url()
    if (url.includes('/login')) {
      // Mode PROD : effectuer le login
      await page.getByLabel('Email').fill('admin')
      await page.getByLabel('Mot de passe').fill('admin')
      await page.getByRole('button', { name: 'Se connecter' }).click()
      await page.waitForURL('/dashboard', { timeout: 10000 })
    }

    await use(page)
  },
})

export { expect }

/**
 * Helper pour naviguer vers une page via la sidebar
 */
export async function navigateTo(page: Page, pageName: string) {
  await page.getByRole('link', { name: pageName }).click()
  await page.waitForLoadState('networkidle')
}

/**
 * Helper pour attendre le chargement des données
 */
export async function waitForDataLoad(page: Page) {
  // Attendre que le spinner disparaisse
  const spinner = page.locator('.animate-spin')
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: 'hidden', timeout: 10000 })
  }
}

/**
 * Helper pour vérifier un toast de succès
 */
export async function expectSuccessToast(page: Page, message?: string) {
  const toast = page.locator('[role="alert"], .toast-success, [class*="bg-green"]')
  await expect(toast).toBeVisible({ timeout: 5000 })
  if (message) {
    await expect(toast).toContainText(message)
  }
}

/**
 * Helper pour vérifier un toast d'erreur
 */
export async function expectErrorToast(page: Page, message?: string) {
  const toast = page.locator('[role="alert"], .toast-error, [class*="bg-red"]')
  await expect(toast).toBeVisible({ timeout: 5000 })
  if (message) {
    await expect(toast).toContainText(message)
  }
}

/**
 * Données de test
 */
export const testData = {
  tenant: {
    name: 'Test Tenant E2E',
    domain: 'test-e2e.quelyos.com',
    adminEmail: 'admin@test-e2e.com',
    adminName: 'Admin Test',
  },
  plan: {
    code: 'test_plan',
    name: 'Plan Test E2E',
    priceMonthly: 49,
    priceYearly: 490,
  },
}
