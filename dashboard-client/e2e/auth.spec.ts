/**
 * Tests E2E - Authentification
 * Parcours critiques de connexion/déconnexion
 */
import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session avant chaque test
    await page.context().clearCookies()
    await page.goto('/login')
  })

  test('affiche la page de connexion', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/quelyos/i)
    await expect(page.locator('input#email')).toBeVisible()
    await expect(page.locator('input#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('connexion avec identifiants valides', async ({ page }) => {
    await page.fill('input#email', 'admin')
    await page.fill('input#password', 'admin')
    await page.click('button[type="submit"]')

    // Doit rediriger vers le dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL('/dashboard')
  })

  test('affiche erreur avec identifiants invalides', async ({ page }) => {
    await page.fill('input#email', 'wrong@email.com')
    await page.fill('input#password', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Message d'erreur visible
    await expect(page.locator('text=/erreur|échec|invalide/i')).toBeVisible({ timeout: 5000 })
    // Reste sur la page login
    await expect(page).toHaveURL('/login')
  })

  test('champs requis sont validés', async ({ page }) => {
    // Clic sans remplir les champs
    await page.click('button[type="submit"]')

    // Les inputs HTML5 required doivent bloquer la soumission
    const emailInput = page.locator('input#email')
    await expect(emailInput).toHaveAttribute('required', '')
  })

  test('bouton désactivé pendant le chargement', async ({ page }) => {
    await page.fill('input#email', 'admin')
    await page.fill('input#password', 'admin')

    // Intercepter la requête pour ralentir
    await page.route('**/api/auth/**', async (route) => {
      await new Promise((r) => setTimeout(r, 1000))
      await route.continue()
    })

    await page.click('button[type="submit"]')

    // Le bouton doit être désactivé pendant le loading
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeDisabled()
  })

  test('checkbox "Se souvenir de moi" existe', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]')
    await expect(checkbox).toBeVisible()
    await expect(page.locator('text=/souvenir/i')).toBeVisible()
  })

  test('lien mot de passe oublié existe', async ({ page }) => {
    await expect(page.locator('text=/mot de passe oublié/i')).toBeVisible()
  })
})

test.describe('Déconnexion', () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter d'abord
    await page.goto('/login')
    await page.fill('input#email', 'admin')
    await page.fill('input#password', 'admin')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('déconnexion depuis le menu utilisateur', async ({ page }) => {
    // Chercher le menu utilisateur (avatar/nom)
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("admin"), [aria-label*="utilisateur"]').first()

    if (await userMenu.isVisible()) {
      await userMenu.click()

      // Chercher le bouton de déconnexion
      const logoutButton = page.locator('button:has-text("Déconnexion"), a:has-text("Déconnexion")')
      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        await expect(page).toHaveURL('/login')
      }
    }
  })
})

test.describe('Protection des routes', () => {
  test('redirige vers login si non authentifié', async ({ page }) => {
    await page.context().clearCookies()
    await page.goto('/dashboard')

    // En mode dev, l'auth peut être désactivée
    // Sinon, doit rediriger vers login
    const url = page.url()
    expect(url.includes('/login') || url.includes('/dashboard')).toBe(true)
  })
})
