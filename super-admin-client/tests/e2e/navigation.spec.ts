/**
 * Tests E2E - Navigation
 *
 * Note: Ces tests nécessitent d'être authentifié.
 * À terme, créer un fixture Playwright pour auto-login.
 */

import { test, expect } from '@playwright/test'

test.describe.skip('Navigation (nécessite auth)', () => {
  // Helper pour se connecter avant chaque test
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // TODO : Automatiser le login via fixture ou cookies
    // Pour l'instant, tests skippés car nécessite auth manuelle
  })

  test('devrait naviguer vers Tenants', async ({ page }) => {
    await page.getByRole('link', { name: 'Tenants' }).click()
    await expect(page).toHaveURL('/tenants')
    await expect(page.getByRole('heading', { name: /tenants/i })).toBeVisible()
  })

  test('devrait naviguer vers Abonnements', async ({ page }) => {
    await page.getByRole('link', { name: 'Abonnements' }).click()
    await expect(page).toHaveURL('/subscriptions')
    await expect(page.getByRole('heading', { name: /abonnements/i })).toBeVisible()
  })

  test('devrait naviguer vers Facturation', async ({ page }) => {
    await page.getByRole('link', { name: 'Facturation' }).click()
    await expect(page).toHaveURL('/billing')
    await expect(page.getByRole('heading', { name: /facturation/i })).toBeVisible()
  })

  test('devrait naviguer vers Monitoring', async ({ page }) => {
    await page.getByRole('link', { name: 'Monitoring' }).click()
    await expect(page).toHaveURL('/monitoring')
    await expect(page.getByRole('heading', { name: /monitoring/i })).toBeVisible()
  })

  test('devrait se déconnecter', async ({ page }) => {
    await page.getByRole('button', { name: /logout|déconnexion/i }).click()
    await expect(page).toHaveURL('/login')
    await expect(page.getByText('Quelyos Super Admin')).toBeVisible()
  })
})
