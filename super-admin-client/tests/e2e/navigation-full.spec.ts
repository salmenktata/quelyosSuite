/**
 * Tests E2E - Navigation Complète
 *
 * Vérifie :
 * - Sidebar et liens
 * - Theme toggle (dark/light)
 * - Navigation entre pages
 * - Logo et branding
 */

import { test, expect, waitForDataLoad } from './fixtures'

test.describe('Navigation', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard')
    await waitForDataLoad(page)
  })

  test('devrait afficher la sidebar', async ({ authenticatedPage: page }) => {
    await expect(page.locator('aside')).toBeVisible()
  })

  test('devrait afficher le logo et le titre', async ({ authenticatedPage: page }) => {
    await expect(page.getByText('Quelyos')).toBeVisible()
    await expect(page.getByText('Super Admin')).toBeVisible()
  })

  test('devrait afficher tous les liens de navigation', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /tenants/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /plans/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /abonnements/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /facturation/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /monitoring/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /backups/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /paramètres/i })).toBeVisible()
  })

  test('devrait naviguer vers chaque page', async ({ authenticatedPage: page }) => {
    // Dashboard
    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL('/dashboard')

    // Tenants
    await page.getByRole('link', { name: /tenants/i }).click()
    await expect(page).toHaveURL('/tenants')

    // Plans
    await page.getByRole('link', { name: /plans/i }).click()
    await expect(page).toHaveURL('/plans')

    // Abonnements
    await page.getByRole('link', { name: /abonnements/i }).click()
    await expect(page).toHaveURL('/subscriptions')

    // Facturation
    await page.getByRole('link', { name: /facturation/i }).click()
    await expect(page).toHaveURL('/billing')

    // Monitoring
    await page.getByRole('link', { name: /monitoring/i }).click()
    await expect(page).toHaveURL('/monitoring')

    // Backups
    await page.getByRole('link', { name: /backups/i }).click()
    await expect(page).toHaveURL('/backups')

    // Paramètres
    await page.getByRole('link', { name: /paramètres/i }).click()
    await expect(page).toHaveURL('/settings')
  })

  test('devrait afficher le bouton toggle theme', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /mode clair|mode sombre/i })).toBeVisible()
  })

  test('devrait toggle entre light et dark mode', async ({ authenticatedPage: page }) => {
    const themeButton = page.getByRole('button', { name: /mode clair|mode sombre/i })

    // Récupérer l'état initial
    const initialText = await themeButton.textContent()

    // Toggle
    await themeButton.click()
    await page.waitForTimeout(300)

    // Vérifier que le texte a changé
    const newText = await themeButton.textContent()
    expect(newText).not.toBe(initialText)

    // Toggle back
    await themeButton.click()
    await page.waitForTimeout(300)

    const finalText = await themeButton.textContent()
    expect(finalText).toBe(initialText)
  })

  test('devrait appliquer les classes dark mode', async ({ authenticatedPage: page }) => {
    // Passer en mode sombre
    const themeButton = page.getByRole('button', { name: /mode sombre/i })

    if (await themeButton.isVisible()) {
      await themeButton.click()
      await page.waitForTimeout(300)

      // Vérifier que le body ou html a la classe dark
      const hasDarkClass = await page.evaluate(() => {
        return document.documentElement.classList.contains('dark') ||
               document.body.classList.contains('dark')
      })
      expect(hasDarkClass).toBe(true)
    }
  })

  test('devrait afficher le bouton déconnexion', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /déconnexion/i })).toBeVisible()
  })

  test('devrait mettre en surbrillance le lien actif', async ({ authenticatedPage: page }) => {
    // Naviguer vers Tenants
    await page.getByRole('link', { name: /tenants/i }).click()
    await page.waitForURL('/tenants')

    // Le lien Tenants devrait avoir une classe active
    const tenantsLink = page.getByRole('link', { name: /tenants/i })
    const classes = await tenantsLink.getAttribute('class')
    expect(classes).toMatch(/teal|active|bg-/)
  })

  test('devrait rediriger / vers /dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/')
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('devrait rediriger une URL inconnue vers dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/unknown-page-xyz')
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })
})
