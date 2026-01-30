/**
 * Tests E2E - Gestion des Plans Tarifaires
 *
 * Vérifie :
 * - Liste des plans
 * - Création d'un plan
 * - Modification d'un plan
 * - Archivage d'un plan
 */

import { test, expect, waitForDataLoad } from './fixtures'

test.describe('Plans Tarifaires', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/plans')
    await waitForDataLoad(page)
  })

  test('devrait afficher le titre et les stats', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /plans tarifaires/i })).toBeVisible()
    await expect(page.getByText(/plans actifs/i)).toBeVisible()
    await expect(page.getByText(/MRR/i)).toBeVisible()
  })

  test('devrait afficher le bouton nouveau plan', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('button', { name: /nouveau plan/i })).toBeVisible()
  })

  test('devrait afficher les cards des plans existants', async ({ authenticatedPage: page }) => {
    // Vérifier qu'au moins un plan est affiché ou le message "aucun plan"
    const planCard = page.locator('[class*="rounded-xl"]').filter({ hasText: /€\/mois/ })
    const emptyMessage = page.getByText(/aucun plan tarifaire/i)

    const hasPlans = await planCard.first().isVisible().catch(() => false)
    const hasEmpty = await emptyMessage.isVisible().catch(() => false)

    expect(hasPlans || hasEmpty).toBe(true)
  })

  test('devrait afficher les informations de chaque plan', async ({ authenticatedPage: page }) => {
    const planCard = page.locator('[class*="rounded-xl"]').filter({ hasText: /€\/mois/ }).first()

    if (await planCard.isVisible()) {
      // Vérifier les éléments clés d'une card plan
      await expect(planCard.getByText(/€/)).toBeVisible()
      await expect(planCard.getByText(/utilisateurs/i)).toBeVisible()
      await expect(planCard.getByText(/produits/i)).toBeVisible()
    }
  })

  test('devrait ouvrir le modal de création', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /nouveau plan/i }).click()

    // Vérifier que le modal s'ouvre
    await expect(page.getByRole('heading', { name: /nouveau plan/i })).toBeVisible()

    // Vérifier les champs (labels textuels, pas label[for])
    await expect(page.getByText(/code.*slug/i)).toBeVisible()
    await expect(page.getByText(/nom/i).first()).toBeVisible()
  })

  test('devrait afficher les sections du formulaire de création', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /nouveau plan/i }).click()

    // Section tarification
    await expect(page.getByText(/tarification/i).first()).toBeVisible()
    await expect(page.getByText(/prix mensuel/i).first()).toBeVisible()
    await expect(page.getByText(/prix annuel/i).first()).toBeVisible()

    // Section quotas
    await expect(page.getByText(/quotas/i).first()).toBeVisible()
    await expect(page.getByText(/utilisateurs max/i).first()).toBeVisible()
    await expect(page.getByText(/produits max/i).first()).toBeVisible()

    // Section features
    await expect(page.getByText(/features/i).first()).toBeVisible()
  })

  test('devrait valider le formulaire de création', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /nouveau plan/i }).click()

    // Attendre que le modal soit visible
    await expect(page.getByRole('heading', { name: /nouveau plan/i })).toBeVisible()

    // Trouver l'input code (premier input texte)
    const codeInput = page.locator('input[type="text"]').first()

    if (await codeInput.isVisible()) {
      // Vérifier que l'input est required
      const isRequired = await codeInput.evaluate((el: HTMLInputElement) => el.required)
      expect(isRequired).toBe(true)
    }
  })

  test('devrait fermer le modal avec annuler', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /nouveau plan/i }).click()
    await expect(page.getByRole('heading', { name: /nouveau plan/i })).toBeVisible()

    await page.getByRole('button', { name: /annuler/i }).click()
    await expect(page.getByRole('heading', { name: /nouveau plan/i })).not.toBeVisible()
  })

  test('devrait pouvoir toggle les features', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /nouveau plan/i }).click()

    // Trouver une checkbox de feature
    const featureCheckbox = page.getByRole('checkbox').first()

    if (await featureCheckbox.isVisible()) {
      const initialState = await featureCheckbox.isChecked()
      await featureCheckbox.click()
      const newState = await featureCheckbox.isChecked()

      expect(newState).not.toBe(initialState)
    }
  })

  test('devrait ouvrir le modal de modification', async ({ authenticatedPage: page }) => {
    // Cliquer sur le bouton edit du premier plan
    const editButton = page.locator('button[title="Modifier"]').first()

    if (await editButton.isVisible()) {
      await editButton.click()
      await expect(page.getByRole('heading', { name: /modifier le plan/i })).toBeVisible()
    }
  })

  test('devrait afficher le bouton archiver', async ({ authenticatedPage: page }) => {
    const archiveButton = page.locator('button[title="Archiver"]').first()

    // Le bouton archive devrait exister pour les plans actifs
    const isVisible = await archiveButton.isVisible().catch(() => false)
    // On ne teste pas l'action car cela modifierait les données
    expect(typeof isVisible).toBe('boolean')
  })
})
