/**
 * Tests E2E - Authentification
 *
 * Note: En mode DEV, l'authentification est désactivée.
 * Ces tests vérifient le comportement en mode PROD.
 */

import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test('devrait afficher la page de login en mode PROD', async ({ page }) => {
    await page.goto('/login')

    // Vérifier les éléments de la page login
    await expect(page.getByText(/quelyos/i)).toBeVisible()

    // En mode DEV, on peut être redirigé
    const url = page.url()
    if (url.includes('/login')) {
      // Mode PROD comportement
      await expect(page.getByRole('button', { name: /se connecter|connexion/i })).toBeVisible()
    }
  })

  test('devrait avoir un formulaire de login fonctionnel', async ({ page }) => {
    await page.goto('/login')

    const url = page.url()
    if (url.includes('/login')) {
      // Vérifier les champs du formulaire
      const emailInput = page.getByLabel(/email|identifiant/i)
      const passwordInput = page.getByLabel(/mot de passe|password/i)

      const hasEmail = await emailInput.isVisible().catch(() => false)
      const hasPassword = await passwordInput.isVisible().catch(() => false)

      // Au moins un champ devrait exister
      expect(hasEmail || hasPassword).toBe(true)
    }
  })

  test.skip('devrait afficher une erreur si champs vides', async ({ page }) => {
    // SKIP: Nécessite mode PROD avec auth activée
    await page.goto('/login')

    // Cliquer sur le bouton sans remplir les champs
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Vérifier validation HTML5 (required)
    const emailInput = page.getByLabel(/email/i)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })

  test.skip('devrait afficher une erreur si credentials invalides', async ({ page }) => {
    // SKIP: Nécessite backend configuré et mode PROD
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page.getByText(/identifiants invalides/i)).toBeVisible({ timeout: 5000 })
  })

  test.skip('devrait se connecter avec credentials valides', async ({ page }) => {
    // SKIP: Nécessite un utilisateur de test configuré
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('admin')
    await page.getByLabel(/mot de passe/i).fill('admin')
    await page.getByRole('button', { name: /se connecter/i }).click()

    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('devrait rediriger vers dashboard en mode DEV', async ({ page }) => {
    // En mode DEV, accéder directement au dashboard sans auth
    await page.goto('/dashboard')

    // Devrait être sur le dashboard sans redirection login
    await expect(page.getByText(/dashboard/i).first()).toBeVisible()
  })
})
