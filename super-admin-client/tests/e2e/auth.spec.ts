/**
 * Tests E2E - Authentification
 */

import { test, expect } from '@playwright/test'

test.describe('Authentification', () => {
  test('devrait afficher la page de login', async ({ page }) => {
    await page.goto('/')

    // Vérifier le titre
    await expect(page.getByText('Quelyos Super Admin')).toBeVisible()
    await expect(page.getByText('Administration plateforme SaaS')).toBeVisible()

    // Vérifier les champs du formulaire
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Mot de passe')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible()
  })

  test('devrait afficher une erreur si champs vides', async ({ page }) => {
    await page.goto('/')

    // Cliquer sur le bouton sans remplir les champs
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Vérifier validation HTML5 (required)
    const emailInput = page.getByLabel('Email')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBe(true)
  })

  test('devrait afficher une erreur si credentials invalides', async ({ page }) => {
    await page.goto('/')

    // Remplir avec des mauvais identifiants
    await page.getByLabel('Email').fill('wrong@example.com')
    await page.getByLabel('Mot de passe').fill('wrongpassword')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Attendre le message d'erreur
    await expect(page.getByText(/identifiants invalides/i)).toBeVisible({ timeout: 5000 })
  })

  test.skip('devrait se connecter avec credentials valides', async ({ page }) => {
    // SKIP : Nécessite un utilisateur de test configuré
    // Pour activer : créer un user test dans Odoo et décommenter
    await page.goto('/')

    await page.getByLabel('Email').fill('admin@quelyos.com')
    await page.getByLabel('Mot de passe').fill('admin')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Attendre redirection vers dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 })
    await expect(page.getByText('Dashboard')).toBeVisible()
  })
})
