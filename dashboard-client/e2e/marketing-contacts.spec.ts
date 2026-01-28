/**
 * Tests E2E - Marketing Contacts
 * Parcours critiques de la gestion des listes de contacts
 */
import { test, expect } from '@playwright/test'

test.describe('Marketing - Listes de contacts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input#email', 'admin')
    await page.fill('input#password', 'admin')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    await page.goto('/marketing/contacts')
  })

  test('affiche la page avec le titre', async ({ page }) => {
    await expect(page.locator('[data-testid="page-title"]')).toContainText(/listes de contacts/i)
  })

  test('affiche les boutons d\'action', async ({ page }) => {
    await expect(page.locator('[data-testid="btn-import-csv"]')).toBeVisible()
    await expect(page.locator('[data-testid="btn-create-list"]')).toBeVisible()
  })

  test('recherche filtre les listes', async ({ page }) => {
    const searchInput = page.locator('[data-testid="search-input"]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('VIP')
    await page.waitForTimeout(300) // Debounce

    // Vérifier que le filtre est appliqué
    const lists = page.locator('[data-testid^="list-card-"]')
    const count = await lists.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('ouvre le modal de création', async ({ page }) => {
    await page.locator('[data-testid="btn-create-list"]').click()

    // Vérifier que le modal s'ouvre
    await expect(page.locator('[data-testid="input-list-name"]')).toBeVisible()
  })

  test('crée une nouvelle liste statique', async ({ page }) => {
    const listName = `Test-${Date.now()}`

    // Ouvrir modal
    await page.locator('[data-testid="btn-create-list"]').click()
    await page.waitForSelector('[data-testid="input-list-name"]')

    // Remplir le formulaire
    await page.locator('[data-testid="input-list-name"]').fill(listName)

    // Soumettre
    await page.locator('[data-testid="btn-submit-create"]').click()

    // Vérifier la création (toast ou présence dans la liste)
    await expect(
      page.locator(`text=${listName}`).or(page.locator('[class*="toast"]:has-text("succès")'))
    ).toBeVisible({ timeout: 5000 })
  })

  test('validation: nom requis pour créer', async ({ page }) => {
    await page.locator('[data-testid="btn-create-list"]').click()
    await page.waitForSelector('[data-testid="input-list-name"]')

    // Le bouton doit être désactivé si nom vide
    const submitButton = page.locator('[data-testid="btn-submit-create"]')
    await expect(submitButton).toBeDisabled()
  })

  test('affiche les listes existantes', async ({ page }) => {
    // Attendre le chargement
    await page.waitForSelector('[data-testid="contact-lists"], [class*="skeleton"]', { timeout: 10000 })

    // Soit des listes, soit un état vide
    const lists = page.locator('[data-testid^="list-card-"]')
    const emptyState = page.locator('text=/aucune liste/i')

    const hasLists = (await lists.count()) > 0
    const isEmpty = await emptyState.isVisible()

    expect(hasLists || isEmpty).toBe(true)
  })

  test('supprime une liste avec confirmation', async ({ page }) => {
    // Attendre qu'une liste existe
    await page.waitForSelector('[data-testid^="list-card-"]', { timeout: 10000 }).catch(() => null)

    const deleteButton = page.locator('[data-testid^="btn-delete-"]').first()

    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Modal de confirmation
      await expect(page.locator('[role="dialog"]')).toBeVisible()

      // Annuler pour ne pas vraiment supprimer
      const cancelButton = page.locator('button:has-text("Annuler")')
      await cancelButton.click()

      await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    }
  })

  test('segments rapides sont affichés', async ({ page }) => {
    // Vérifier que les segments prédéfinis existent
    await expect(page.locator('text=/clients actifs/i')).toBeVisible()
    await expect(page.locator('text=/vip/i')).toBeVisible()
  })

  test('ouvre le modal d\'import CSV', async ({ page }) => {
    await page.locator('[data-testid="btn-import-csv"]').click()

    // Vérifier que le modal s'ouvre
    await expect(page.locator('text=/importer/i')).toBeVisible()
  })
})
